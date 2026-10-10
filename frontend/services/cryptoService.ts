// Client-side Web Crypto API utilities - Zero Access Architecture

export async function calculateSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateAuditId(): string {
  const chars = '0123456789ABCDEF';
  let result = 'DIFF-2026-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function simulatePasskeyBiometricChallenge(userEmail: string): Promise<{ success: boolean; deviceCredentialId: string }> {
  // Simulate WebAuthn FIDO2 assertion
  await new Promise(resolve => setTimeout(resolve, 800));
  const randomEntropy = Math.random().toString(36).substring(2, 15);
  const deviceCredentialId = await calculateSha256(`${userEmail}::${randomEntropy}::WEBAUTHN_2026`);
  return {
    success: true,
    deviceCredentialId: deviceCredentialId.substring(0, 24)
  };
}
