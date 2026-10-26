import {
  GoogleAuthProvider,
  linkWithPopup,
  reauthenticateWithPopup,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

function driveProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.addScope(DRIVE_SCOPE);
  provider.setCustomParameters({ prompt: 'consent', access_type: 'online' });
  return provider;
}

function codeOf(err: unknown): string {
  return err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code || '') : '';
}

/**
 * Incremental Google OAuth for Drive file create only (not requested at login).
 */
export async function getGoogleDriveAccessToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in first.');
  const provider = driveProvider();
  const hasGoogle = user.providerData.some((p) => p.providerId === 'google.com');

  try {
    const result =
      !hasGoogle || user.isAnonymous
        ? await linkWithPopup(user, provider)
        : await reauthenticateWithPopup(user, provider);
    const cred = GoogleAuthProvider.credentialFromResult(result);
    if (!cred?.accessToken) throw new Error('Google did not return a Drive access token.');
    return cred.accessToken;
  } catch (err) {
    const code = codeOf(err);
    if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
      const result = await signInWithPopup(auth, provider);
      const cred = GoogleAuthProvider.credentialFromResult(result);
      if (!cred?.accessToken) throw new Error('Google did not return a Drive access token.');
      return cred.accessToken;
    }
    if (code === 'auth/popup-closed-by-user') throw new Error('Google Drive consent was closed.');
    throw err;
  }
}

export async function uploadPdfToGoogleDrive(
  blob: Blob,
  fileName: string,
  accessToken: string
): Promise<{ fileId: string; webViewLink: string }> {
  const metadata = JSON.stringify({
    name: fileName,
    mimeType: 'application/pdf',
    description: 'Agape Sovereign AI · Identity Audit Report (user-initiated export)',
  });
  const pdfBuf = new Uint8Array(await blob.arrayBuffer());
  const boundary = 'agape_sovereign_boundary';
  const encoder = new TextEncoder();
  const head = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`
  );
  const tail = encoder.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(head.length + pdfBuf.length + tail.length);
  body.set(head, 0);
  body.set(pdfBuf, head.length);
  body.set(tail, head.length + pdfBuf.length);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.id) {
    throw new Error(json.error?.message || `Google Drive upload failed (${res.status}).`);
  }
  return { fileId: json.id, webViewLink: json.webViewLink || `https://drive.google.com/file/d/${json.id}/view` };
}
