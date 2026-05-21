// Minimal WebAuthn helper functions (client-side)

export async function createPasskeyPublicKeyCredentialCreationOptions(publicKey) {
  // wrapper for navigator.credentials.create
  return await navigator.credentials.create({ publicKey });
}

export async function getPasskeyAssertion(publicKey) {
  return await navigator.credentials.get({ publicKey });
}

// Helper to convert base64url to ArrayBuffer
export function base64UrlToBuffer(base64url) {
  base64url = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64url.length % 4;
  if (pad) base64url += '='.repeat(4 - pad);
  const binary = atob(base64url);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
