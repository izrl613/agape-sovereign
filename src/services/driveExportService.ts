import { toast } from 'sonner';

let gapiInited = false;
let gisInited = false;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken = '';

// Default values, would typically come from env vars
const CLIENT_ID = import.meta.env.VITE_FIREBASE_CLIENT_ID || 'dummy-client-id';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const driveExportService = {
  /**
   * Initializes the Google API client and Google Identity Services
   * Should be called when the user needs to export to Drive.
   */
  async initDriveClient(): Promise<void> {
    if (gapiInited && gisInited) return;

    return new Promise((resolve, reject) => {
      // 1. Load GAPI
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => {
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              discoveryDocs: [DISCOVERY_DOC],
            });
            gapiInited = true;
            if (gisInited) resolve();
          } catch (err) {
            console.error('Error initializing GAPI client:', err);
            reject(err);
          }
        });
      };
      document.body.appendChild(gapiScript);

      // 2. Load GIS
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = () => {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse) => {
            if (tokenResponse.error !== undefined) {
              reject(tokenResponse);
            }
            accessToken = tokenResponse.access_token;
            // Token retrieved, we can now proceed
          },
        });
        gisInited = true;
        if (gapiInited) resolve();
      };
      document.body.appendChild(gisScript);
    });
  },

  /**
   * Export a Blob to Google Drive.
   */
  async exportToDrive(pdfBlob: Blob, fileName: string): Promise<void> {
    await this.initDriveClient();

    return new Promise((resolve, reject) => {
      if (!tokenClient) {
        reject(new Error("Token client not initialized"));
        return;
      }

      // Request token if we don't have one
      if (!accessToken) {
        tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            reject(resp);
          }
          accessToken = resp.access_token;
          try {
            await this.uploadFile(pdfBlob, fileName);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // We have a token, attempt upload directly
        this.uploadFile(pdfBlob, fileName)
          .then(resolve)
          .catch(reject);
      }
    });
  },

  async uploadFile(fileBlob: Blob, fileName: string): Promise<void> {
    const metadata = {
      name: fileName,
      mimeType: 'application/pdf',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      toast.success('Successfully exported to Google Drive');
    } catch (error) {
      console.error('Drive upload error:', error);
      toast.error('Failed to export to Google Drive');
      throw error;
    }
  }
};

// Ensure google namespace is available for TS
declare global {
  interface Window {
    google: any;
  }
  const google: any;
  const gapi: any;
}
