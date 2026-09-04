/**
 * ============================================================
 * ARCHITECT AI — WebAuthn Passkey Management
 * Agape Sovereign Enclave 2026
 * ============================================================
 * 
 * Zero-knowledge, device-bound passkey registration and authentication
 * Implements WebAuthn Level 3 / FIDO2 standards
 */

import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

export interface PasskeyCredential {
  id: string;
  publicKey: ArrayBuffer;
  signCount: number;
  transports?: AuthenticatorTransport[];
  aaguid?: string;
  credentialType?: 'public-key';
  createdAt: number;
  lastUsedAt: number;
}

/**
 * Handle client-side passkey creation
 */
export const createPasskey = async (
  optionsJSON: any
) => {
  try {
    return await startRegistration({ optionsJSON });
  } catch (error) {
    console.error('Passkey creation failed:', error);
    throw error;
  }
};

/**
 * Assert passkey for authentication (Client-side)
 */
export const assertPasskey = async (
  optionsJSON: any
) => {
  try {
    return await startAuthentication({ optionsJSON });
  } catch (error) {
    console.error('Passkey assertion failed:', error);
    throw error;
  }
};

/**
 * Check if browser supports WebAuthn
 */
export const isWebAuthnSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined &&
    navigator.credentials.create !== undefined &&
    navigator.credentials.get !== undefined
  );
};

/**
 * Check if platform authenticator available
 */
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) {
    return false;
  }

  return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
};
