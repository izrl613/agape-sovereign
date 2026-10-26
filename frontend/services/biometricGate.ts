/**
 * User-presence / biometric gate for Identity Audit Report handoff.
 * Uses WebAuthn with userVerification required. Does not change the Firebase session.
 */

function hexToBytes(hex: string): Uint8Array {
  const clean = (hex || '00').replace(/[^0-9a-f]/gi, '').padEnd(64, '0').slice(0, 64);
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function rpId(): string {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return host;
  if (host === 'www.sovereign.nyc' || host === 'sovereign.nyc') return 'sovereign.nyc';
  return host;
}

export interface BiometricProof {
  method: 'discoverable-passkey' | 'platform-passkey';
  credentialId: string;
  verifiedAt: string;
}

export async function confirmWithBiometrics(challengeHex: string, user: { uid: string; email?: string; name?: string }): Promise<BiometricProof> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    throw new Error('This browser has no WebAuthn authenticator.');
  }
  const challenge = hexToBytes(challengeHex);
  const id = rpId();

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: id,
        userVerification: 'required',
        timeout: 90_000,
        allowCredentials: [],
      },
    })) as PublicKeyCredential | null;
    if (assertion?.id) {
      return {
        method: 'discoverable-passkey',
        credentialId: assertion.id,
        verifiedAt: new Date().toISOString(),
      };
    }
  } catch (err: unknown) {
    const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
    if (name === 'NotAllowedError') throw new Error('Biometric verification was cancelled.');
  }

  const userId = new TextEncoder().encode(user.uid || 'guest-operator');
  const created = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Agape Sovereign AI', id },
      user: {
        id: userId,
        name: user.email || `${user.uid}@guest.sovereign.nyc`,
        displayName: user.name || 'Sovereign Operator',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 90_000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null;

  if (!created?.id) throw new Error('Biometric verification failed. Unlock Face ID, Touch ID, Windows Hello, or a security key.');

  return {
    method: 'platform-passkey',
    credentialId: created.id,
    verifiedAt: new Date().toISOString(),
  };
}
