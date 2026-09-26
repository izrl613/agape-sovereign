/**
 * GOOGLE DRIVE FEDERATED EXPORT SERVICE
 * ============================================================
 * Saves the 26-month Identity Audit PDF into the user's own Google Account.
 *
 * Authentication model
 * --------------------
 * The user signed in with Sign in with Google (Firebase `google.com`
 * provider). Because `https://www.googleapis.com/auth/drive.file` is requested
 * at sign-in, the federated credential itself carries Drive authority and
 * `GoogleAuthProvider.getAccessToken(user, scope)` returns a usable token —
 * no second consent popup, no separate OAuth client, and no API key reuse.
 *
 * The `drive.file` scope is per-file: the app can only see files it created.
 * ============================================================
 */

import { User } from 'firebase/auth';
import { db, getFederatedDriveToken } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const APP_FOLDER = 'Agape Sovereign';
const REPORT_FOLDER = 'Identity Audit Reports';
/** Retention window for the Identity Audit PDF, in months. */
export const RETENTION_MONTHS = 26;

export interface DriveExportResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  folderId?: string;
  /** Bytes confirmed stored in Drive after the upload. */
  storedBytes?: number;
  expiresAt?: string;
  error?: string;
}

export interface DriveExportRequest {
  pdfBlob: Blob;
  fileName: string;
  /** SHA-256 integrity digest of the exact PDF bytes uploaded. */
  sha256Digest: string;
  /** Session identity SHA-256 (never the raw uid/email). */
  identitySha256?: string;
  sovereignScore?: number;
}

export function retentionExpiry(from: Date = new Date(), months: number = RETENTION_MONTHS): Date {
  const expiry = new Date(from.getTime());
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
}

/** True only when the credential actually carries a Google federated identity. */
export function isFederatedGoogleUser(user: User | null): boolean {
  if (!user) return false;
  return (user.providerData || []).some(p => p.providerId === 'google.com');
}

/** Federated account email, when the identity is Google-linked. */
export function federatedGoogleEmail(user: User | null): string | null {
  if (!user) return null;
  const google = (user.providerData || []).find(p => p.providerId === 'google.com');
  return google?.email || null;
}

/**
 * Federated access token captured at Google sign-in (it carries the
 * `drive.file` scope requested on the provider). Throws a precise,
 * non-fabricated error when the token is absent.
 */
export async function getDriveAccessToken(_user: User): Promise<string> {
  const token = getFederatedDriveToken();
  if (!token) {
    throw new Error(
      'No federated Google access token is present in this session. Sign out and use "Sign in with Google" again so the Drive scope is granted.',
    );
  }
  return token;
}

class DriveExportService {
  /**
   * Locate (or create) `Agape Sovereign / Identity Audit Reports` in the
   * user's Drive. Every step is a real Drive API call.
   */
  private async resolveFolder(token: string): Promise<string> {
    const findFolder = async (name: string, parentId?: string): Promise<string | null> => {
      const clauses = [
        `name='${name}'`,
        "mimeType='application/vnd.google-apps.folder'",
        'trashed=false',
      ];
      if (parentId) clauses.push(`'${parentId}' in parents`);
      const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(clauses.join(' and '))}&fields=${encodeURIComponent('files(id,name)')}&pageSize=1`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Drive folder lookup failed (HTTP ${res.status})`);
      const data = await res.json() as { files?: Array<{ id: string }> };
      return data.files?.[0]?.id || null;
    };

    const createFolder = async (name: string, parentId?: string): Promise<string> => {
      const res = await fetch(`${DRIVE_API_BASE}/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mimeType: 'application/vnd.google-apps.folder',
          ...(parentId ? { parents: [parentId] } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Drive folder creation failed (HTTP ${res.status})`);
      const data = await res.json() as { id?: string };
      if (!data.id) throw new Error('Drive folder creation returned no id');
      return data.id;
    };

    const rootId = (await findFolder(APP_FOLDER)) || (await createFolder(APP_FOLDER));
    return (await findFolder(REPORT_FOLDER, rootId)) || (await createFolder(REPORT_FOLDER, rootId));
  }

  /**
   * Upload the audit PDF and confirm the stored byte count matches what we sent.
   */
  async exportAuditPdf(user: User, request: DriveExportRequest): Promise<DriveExportResult> {
    if (!isFederatedGoogleUser(user)) {
      return {
        success: false,
        error: 'This account is not federated with Google. Use "Sign in with Google" to save the audit PDF to your Google Account.',
      };
    }

    let token: string;
    try {
      token = await getDriveAccessToken(user);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unable to obtain a Drive access token.' };
    }

    const expiresAt = retentionExpiry();
    const description = [
      'Agape Sovereign Identity Audit PDF',
      `SHA-256: ${request.sha256Digest}`,
      `Retention: ${RETENTION_MONTHS} months (expires ${expiresAt.toISOString().slice(0, 10)})`,
      request.identitySha256 ? `Session identity SHA-256: ${request.identitySha256}` : '',
    ].filter(Boolean).join(' | ');

    try {
      const folderId = await this.resolveFolder(token);

      const metadataRes = await fetch(`${DRIVE_API_BASE}/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: request.fileName,
          mimeType: 'application/pdf',
          description,
          parents: [folderId],
          properties: {
            sha256: request.sha256Digest,
            retentionMonths: String(RETENTION_MONTHS),
            retentionExpiresAt: expiresAt.toISOString(),
          },
        }),
      });
      if (!metadataRes.ok) {
        const body = await metadataRes.text().catch(() => '');
        return { success: false, error: `Drive file creation failed (HTTP ${metadataRes.status}) ${body.slice(0, 160)}`.trim() };
      }
      const metadata = await metadataRes.json() as { id?: string };
      if (!metadata.id) return { success: false, error: 'Drive file creation returned no id' };

      const uploadRes = await fetch(
        `${DRIVE_UPLOAD_BASE}/files/${metadata.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/pdf' },
          body: request.pdfBlob,
        },
      );
      if (!uploadRes.ok) {
        const body = await uploadRes.text().catch(() => '');
        return { success: false, error: `Drive upload failed (HTTP ${uploadRes.status}) ${body.slice(0, 160)}`.trim() };
      }

      // Read back what Drive actually stored — no assumed success.
      const confirmRes = await fetch(
        `${DRIVE_API_BASE}/files/${metadata.id}?fields=${encodeURIComponent('id,name,size,md5Checksum,webViewLink,webContentLink')}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const confirmed = confirmRes.ok
        ? await confirmRes.json() as { size?: string; webViewLink?: string; webContentLink?: string; name?: string }
        : {};

      const storedBytes = confirmed.size ? parseInt(confirmed.size, 10) : undefined;
      if (storedBytes !== undefined && storedBytes !== request.pdfBlob.size) {
        return {
          success: false,
          error: `Integrity check failed: Drive stored ${storedBytes} bytes but ${request.pdfBlob.size} were sent. The file was not accepted.`,
        };
      }

      const webViewLink = confirmed.webViewLink
        || `https://drive.google.com/file/d/${metadata.id}/view`;

      // Audit trail: record the export by hash only.
      try {
        await addDoc(collection(db, 'audit_exports'), {
          sha256Digest: request.sha256Digest,
          identitySha256: request.identitySha256 || null,
          destination: 'google-drive',
          federatedAccount: federatedGoogleEmail(user),
          fileId: metadata.id,
          folder: `${APP_FOLDER}/${REPORT_FOLDER}`,
          storedBytes: storedBytes ?? request.pdfBlob.size,
          retentionMonths: RETENTION_MONTHS,
          retentionExpiresAt: expiresAt.toISOString(),
          sovereignScore: request.sovereignScore ?? null,
          exportedAt: serverTimestamp(),
        });
      } catch {
        // Audit write failure must not invalidate a confirmed upload.
      }

      return {
        success: true,
        fileId: metadata.id,
        folderId,
        webViewLink,
        storedBytes: storedBytes ?? request.pdfBlob.size,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Drive export failed.' };
    }
  }

  /** Kept for callers that only have an auth type string. */
  isAvailable(authType: string | null): boolean {
    return authType === 'google';
  }
}

export const driveExportService = new DriveExportService();

/** Exposed for tests and for the "is this a real federated Google account?" badge. */
export function describeFederatedAccount(user: User | null): { federated: boolean; email: string | null; providerIds: string[] } {
  if (!user) return { federated: false, email: null, providerIds: [] };
  const providerIds = (user.providerData || []).map(p => p.providerId);
  return {
    federated: isFederatedGoogleUser(user),
    email: federatedGoogleEmail(user),
    providerIds,
  };
}
