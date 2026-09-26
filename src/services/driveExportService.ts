/**
 * Google Drive Export Service
 * ============================================================
 * Federated Google Account vault-sync for the 26-Month Identity Audit PDF.
 *
 * Token strategy (in order):
 *   1. OAuth access token captured at Firebase Google sign-in
 *      (the `drive.file` scope is requested on the GoogleAuthProvider, so the
 *      user's single sign-in consent doubles as Drive federation consent —
 *      the "dual security protection" path, zero extra config).
 *   2. Google Identity Services token client as fallback
 *      (requires VITE_GOOGLE_CLIENT_ID — the OAuth 2.0 *Web Client ID*, NOT
 *      the Firebase API key; the api-key-as-client-id bug is fixed here).
 *
 * All Drive writes use the `drive.file` scope — the app can only see files
 * it created itself. Nothing external is read; the user's Drive is untouched
 * outside the Agape Sovereign folder.
 * ============================================================
 */

import { GoogleAuthProvider, User, reauthenticateWithPopup } from 'firebase/auth';

// Google API configuration
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

const ROOT_FOLDER_NAME = 'Agape Sovereign';
const AUDIT_FOLDER_NAME = 'Identity Audit Reports — 26-Month Vault';

declare global {
  interface Window {
    google?: any;
  }
}

export interface DriveExportResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

class DriveExportService {
  private firebaseAccessToken: string | null = null;
  private gisTokenClient: any = null;
  private rootFolderId: string | null = null;
  private auditFolderId: string | null = null;

  /**
   * Called by the auth layer immediately after a successful Google sign-in.
   * The returned OAuth access token carries the drive.file scope.
   */
  setFirebaseAccessToken(token: string | null): void {
    this.firebaseAccessToken = token;
  }

  hasDriveToken(): boolean {
    return !!this.firebaseAccessToken;
  }

  clear(): void {
    this.firebaseAccessToken = null;
    this.rootFolderId = null;
    this.auditFolderId = null;
  }

  /**
   * Refresh a stale token by re-authenticating through the Firebase Google
   * provider (one account-picker popup, consent already granted).
   */
  async refreshViaReauth(user: User, googleProvider: GoogleAuthProvider): Promise<boolean> {
    try {
      const result = await reauthenticateWithPopup(user, googleProvider);
      const cred = GoogleAuthProvider.credentialFromResult(result);
      if (cred?.accessToken) {
        this.firebaseAccessToken = cred.accessToken;
        return true;
      }
    } catch (err) {
      console.warn('[DRIVE] Token refresh via re-auth failed:', err);
    }
    return false;
  }

  /* ── GIS fallback (optional env: VITE_GOOGLE_CLIENT_ID) ─────────────── */

  private async loadGis(): Promise<boolean> {
    if (window.google?.accounts?.oauth2) return true;
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = GIS_SCRIPT_URL;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  private async requestGisToken(): Promise<string | null> {
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) {
      return null; // no fallback configured — Firebase token path only
    }
    const loaded = await this.loadGis();
    if (!loaded) return null;
    return new Promise((resolve) => {
      try {
        if (!this.gisTokenClient) {
          this.gisTokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: DRIVE_SCOPE,
            callback: () => {},
          });
        }
        this.gisTokenClient.callback = (resp: any) => {
          resolve(resp?.access_token || null);
        };
        this.gisTokenClient.requestAccessToken();
      } catch {
        resolve(null);
      }
    });
  }

  /** Resolve a usable access token. */
  private async ensureToken(): Promise<string> {
    if (this.firebaseAccessToken) return this.firebaseAccessToken;
    const gisToken = await this.requestGisToken();
    if (gisToken) return gisToken;
    throw new Error('No Google Drive session. Sign in with Google to federate vault exports.');
  }

  /** Run a Drive API call; on 401 retry once after GIS token refresh. */
  private async driveFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
    const token = await this.ensureToken();
    const res = await fetch(path, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 && retry) {
      this.firebaseAccessToken = null;
      const gisToken = await this.requestGisToken();
      if (gisToken) {
        return fetch(path, {
          ...init,
          headers: { ...(init.headers || {}), Authorization: `Bearer ${gisToken}` },
        });
      }
    }
    return res;
  }

  /* ── Folder management ──────────────────────────────────────────────── */

  private async findFolder(name: string, parentId?: string): Promise<string | null> {
    const q = [
      `name='${name.replace(/'/g, "\\'")}'`,
      `mimeType='application/vnd.google-apps.folder'`,
      'trashed=false',
      parentId ? `'${parentId}' in parents` : `'root' in parents`,
    ].join(' and ');
    const res = await this.driveFetch(`${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.files?.[0]?.id || null;
  }

  private async createFolder(name: string, parentId?: string): Promise<string> {
    const res = await this.driveFetch(`${DRIVE_API_BASE}/files?fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId ? { parents: [parentId] } : {}),
      }),
    });
    if (!res.ok) throw new Error(`Drive folder creation failed (HTTP ${res.status}).`);
    const data = await res.json();
    if (!data?.id) throw new Error('Drive folder creation returned no id.');
    return data.id as string;
  }

  private async ensureAuditFolder(): Promise<string> {
    if (this.auditFolderId) return this.auditFolderId;
    if (!this.rootFolderId) {
      this.rootFolderId = (await this.findFolder(ROOT_FOLDER_NAME)) || (await this.createFolder(ROOT_FOLDER_NAME));
    }
    this.auditFolderId =
      (await this.findFolder(AUDIT_FOLDER_NAME, this.rootFolderId)) ||
      (await this.createFolder(AUDIT_FOLDER_NAME, this.rootFolderId));
    return this.auditFolderId;
  }

  /* ── Public API ─────────────────────────────────────────────────────── */

  /**
   * Upload a PDF blob to the user's federated Google Drive vault.
   * Single multipart/related request — metadata + bytes atomically.
   */
  async exportToDrive(pdfBlob: Blob, fileName: string): Promise<DriveExportResult> {
    try {
      const folderId = await this.ensureAuditFolder();
      const boundary = `sovereign_${Date.now().toString(36)}`;

      const metadata = {
        name: fileName,
        mimeType: 'application/pdf',
        parents: [folderId],
        description: `Agape Sovereign Identity Audit PDF — SHA-256 sealed · 26-month retention · ${new Date().toISOString()}`,
      };

      const body = new Blob(
        [
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
          `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
          pdfBlob,
          `\r\n--${boundary}--`,
        ],
        { type: `multipart/related; boundary=${boundary}` },
      );

      const uploadRes = await this.driveFetch(
        `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,webViewLink`,
        { method: 'POST', body },
      );

      if (!uploadRes.ok) {
        const text = await uploadRes.text().catch(() => '');
        if (uploadRes.status === 401) {
          return { success: false, error: 'Google session expired — sign in with Google again to re-federate Drive access.' };
        }
        if (uploadRes.status === 403) {
          return { success: false, error: 'Drive permission denied — the drive.file scope was not granted during Google sign-in.' };
        }
        return { success: false, error: `Drive upload failed (HTTP ${uploadRes.status}): ${text.slice(0, 160)}` };
      }

      const uploaded = await uploadRes.json();
      return { success: true, fileId: uploaded.id, webViewLink: uploaded.webViewLink };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown Drive export error',
      };
    }
  }

  /**
   * Check if Drive export is available for this session's auth type.
   */
  isAvailable(authType: string | null): boolean {
    return authType === 'google';
  }
}

// Singleton instance
export const driveExportService = new DriveExportService();
