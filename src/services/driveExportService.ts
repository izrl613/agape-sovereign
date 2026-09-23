/**
 * Google Drive Export Service
 * 
 * Handles uploading PDF reports to Google Drive via Google Identity Services + Drive REST API v3.
 * Only available for Google-authenticated users.
 */

// Google API configuration
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GAPI_SCRIPT_URL = 'https://apis.google.com/js/api.js';
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export interface DriveExportResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

class DriveExportService {
  private gapiLoaded = false;
  private gisLoaded = false;
  private tokenClient: any = null;
  private accessToken: string | null = null;

  /**
   * Lazy-load the Google Identity Services and GAPI scripts
   */
  async initDriveClient(): Promise<void> {
    if (this.gapiLoaded && this.gisLoaded) return;

    return new Promise((resolve, reject) => {
      // Load GAPI
      const gapiScript = document.createElement('script');
      gapiScript.src = GAPI_SCRIPT_URL;
      gapiScript.onload = () => {
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            this.gapiLoaded = true;
            checkBothLoaded();
          } catch (err) {
            reject(new Error('Failed to initialize GAPI client'));
          }
        });
      };
      gapiScript.onerror = () => reject(new Error('Failed to load GAPI script'));
      document.head.appendChild(gapiScript);

      // Load GIS (Google Identity Services)
      const gisScript = document.createElement('script');
      gisScript.src = GIS_SCRIPT_URL;
      gisScript.onload = () => {
        this.gisLoaded = true;
        checkBothLoaded();
      };
      gisScript.onerror = () => reject(new Error('Failed to load GIS script'));
      document.head.appendChild(gisScript);

      const checkBothLoaded = () => {
        if (this.gapiLoaded && this.gisLoaded) {
          resolve();
        }
      };
    });
  }

  /**
   * Initialize token client for OAuth 2.0
   */
  async initTokenClient(): Promise<void> {
    if (this.tokenClient) return;

    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore - GIS types not available
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_FIREBASE_API_KEY,
          scope: DRIVE_SCOPE,
          callback: (response: any) => {
            if (response.access_token) {
              this.accessToken = response.access_token;
              resolve();
            } else {
              reject(new Error('Failed to obtain access token'));
            }
          },
        });
        resolve();
      } catch (err) {
        reject(new Error('Failed to initialize token client'));
      }
    });
  }

  /**
   * Request access token
   */
  async requestAccessToken(): Promise<string> {
    if (!this.tokenClient) {
      await this.initTokenClient();
    }

    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore
        this.tokenClient.requestAccessToken();
        // The callback in initTokenClient will resolve the promise
        // We need to handle this differently - using a one-time callback
        const originalCallback = this.tokenClient.callback;
        this.tokenClient.callback = (response: any) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            resolve(response.access_token);
          } else {
            reject(new Error('Failed to obtain access token'));
          }
          // Restore original callback
          this.tokenClient.callback = originalCallback;
        };
      } catch (err) {
        reject(new Error('Failed to request access token'));
      }
    });
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAccessToken(): Promise<string> {
    if (!this.accessToken) {
      await this.requestAccessToken();
    }
    return this.accessToken;
  }

  /**
   * Create or get the Agape Sovereign folder in Drive
   */
  private async getOrCreateFolder(): Promise<string> {
    const token = await this.ensureAccessToken();

    // First, try to find existing folder
    try {
      const searchResponse = await fetch(
        `${DRIVE_API_BASE}/files?q=name='Agape Sovereign' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const searchData = await searchResponse.json();
      if (searchData.files && searchData.files.length > 0) {
        // Return existing folder ID
        return searchData.files[0].id;
      }
    } catch (err) {
      console.warn('Failed to search for existing folder, will create new one');
    }

    // Create new folder
    try {
      const createResponse = await fetch(`${DRIVE_API_BASE}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Agape Sovereign',
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });

      const createData = await createResponse.json();
      if (!createData.id) {
        throw new Error('Failed to create folder');
      }

      // Create DPC Reports subfolder
      const subfolderResponse = await fetch(`${DRIVE_API_BASE}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'DPC Reports',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [createData.id],
        }),
      });

      const subfolderData = await subfolderResponse.json();
      return subfolderData.id || createData.id;
    } catch (err) {
      throw new Error('Failed to create Drive folder');
    }
  }

  /**
   * Export a PDF to Google Drive
   */
  async exportToDrive(pdfBlob: Blob, fileName: string): Promise<DriveExportResult> {
    try {
      await this.initDriveClient();
      const folderId = await this.getOrCreateFolder();
      const token = await this.ensureAccessToken();

      // Upload file metadata first
      const metadataResponse = await fetch(`${DRIVE_API_BASE}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fileName,
          mimeType: 'application/pdf',
          parents: [folderId],
        }),
      });

      const metadata = await metadataResponse.json();
      if (!metadata.id) {
        return { success: false, error: 'Failed to create file metadata' };
      }

      // Upload file content
      const uploadResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${metadata.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/pdf',
          },
          body: pdfBlob,
        }
      );

      if (!uploadResponse.ok) {
        return { success: false, error: 'Failed to upload file content' };
      }

      // Get file with webViewLink
      const fileResponse = await fetch(
        `${DRIVE_API_BASE}/files/${metadata.id}?fields=webViewLink`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const fileData = await fileResponse.json();

      return {
        success: true,
        fileId: metadata.id,
        webViewLink: fileData.webViewLink,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if Drive export is available (user is Google-authenticated)
   */
  isAvailable(authType: string | null): boolean {
    return authType === 'google';
  }
}

// Singleton instance
export const driveExportService = new DriveExportService();
