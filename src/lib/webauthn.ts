/**
 * ============================================================
 * ARCHITECT AI — WebAuthn Passkey Management
 * Agape Sovereign Enclave 2026
 * ============================================================
 * 
 * Zero-knowledge, device-bound passkey registration and authentication
 * Implements WebAuthn Level 3 / FIDO2 standards
 * Every sensitive operation requires fresh passkey assertion
 */

import {
  WebAuthnRegistrationOptions,
  WebAuthnAuthenticationOptions,
  WebAuthnJSONSerializationOptions,
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  ParsedRegistrationCredential,
  ParsedAuthenticationCredential,
} from '@simplewebauthn/browser';
import {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';

// ─── WebAuthn Configuration ─────────────────────────────────
export const WEBAUTHN_CONFIG = {
  rpID: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  rpName: 'Agape Sovereign Enclave',
  origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
  userID: '', // Set at registration time
  userName: '', // Set at registration time
  userDisplayName: '', // Set at registration time
};

// ─── Passkey Registration ────────────────────────────────────
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
 * Generate WebAuthn registration options
 * Must be called server-side and sent to client
 */
export const generatePasskeyRegistration = async (
  userID: string,
  userName: string,
  userDisplayName: string
): Promise<WebAuthnRegistrationOptions> => {
  WEBAUTHN_CONFIG.userID = userID;
  WEBAUTHN_CONFIG.userName = userName;
  WEBAUTHN_CONFIG.userDisplayName = userDisplayName;

  const options = generateRegistrationOptions({
    rpID: WEBAUTHN_CONFIG.rpID,
    rpName: WEBAUTHN_CONFIG.rpName,
    userName: userName,
    userID: userID,
    userDisplayName: userDisplayName,
    // Require resident key (passkey) support
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
      authenticatorAttachment: 'platform', // Device-bound
    },
    attestation: 'direct', // Enhanced security
    timeout: 60000,
    supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
  });

  return options;
};

/**
 * Handle client-side passkey creation
 * Uses WebAuthn API to create device-bound credential
 */
export const createPasskey = async (
  registrationOptions: WebAuthnRegistrationOptions
): Promise<RegistrationResponseJSON> => {
  try {
    // Create the credential using the browser's authenticator
    const response = await navigator.credentials.create({
      publicKey: registrationOptions as PublicKeyCreationOptions,
    });

    if (!response || response.type !== 'public-key') {
      throw new Error('Failed to create passkey credential');
    }

    const credential = response as PublicKeyCredential;
    const attestationObject = credential.response as AuthenticatorAttestationResponse;

    // Convert ArrayBuffer to base64 for storage
    const registrationJSON: RegistrationResponseJSON = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: arrayBufferToBase64(attestationObject.clientDataJSON),
        attestationObject: arrayBufferToBase64(attestationObject.attestationObject),
        transports: attestationObject.getTransports?.() || [],
      },
    };

    return registrationJSON;
  } catch (error) {
    console.error('Passkey creation failed:', error);
    throw error;
  }
};

/**
 * Verify registration response server-side
 * Called from Cloud Function
 */
export const verifyPasskeyRegistration = async (
  registrationJSON: RegistrationResponseJSON,
  registrationOptions: WebAuthnRegistrationOptions,
  expectedOrigin: string,
  expectedRPID: string
): Promise<PasskeyCredential> => {
  try {
    const verification = await verifyRegistrationResponse({
      response: registrationJSON,
      expectedOrigin: expectedOrigin,
      expectedRPID: expectedRPID,
      expectedChallenge: registrationOptions.challenge,
    });

    if (!verification.verified) {
      throw new Error('Passkey verification failed');
    }

    // Store the credential
    const credential: PasskeyCredential = {
      id: registrationJSON.id,
      publicKey: base64ToArrayBuffer(
        (registrationJSON.response as any).publicKey
      ),
      signCount: verification.registrationInfo?.signCount || 0,
      transports: (registrationJSON.response as any).transports,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };

    return credential;
  } catch (error) {
    console.error('Passkey verification failed:', error);
    throw error;
  }
};

// ─── Passkey Authentication ──────────────────────────────────

/**
 * Generate WebAuthn authentication options
 * Called before sensitive operations
 */
export const generatePasskeyChallenge = async (
  userID: string
): Promise<WebAuthnAuthenticationOptions> => {
  const options = generateAuthenticationOptions({
    rpID: WEBAUTHN_CONFIG.rpID,
    userVerification: 'required',
    timeout: 60000,
  });

  return options;
};

/**
 * Assert passkey for authentication
 * Client-side operation
 */
export const assertPasskey = async (
  authenticationOptions: WebAuthnAuthenticationOptions
): Promise<AuthenticationResponseJSON> => {
  try {
    const response = await navigator.credentials.get({
      publicKey: authenticationOptions as PublicKeyRequestOptions,
    });

    if (!response || response.type !== 'public-key') {
      throw new Error('Failed to get passkey credential');
    }

    const credential = response as PublicKeyCredential;
    const assertionResponse = credential.response as AuthenticatorAssertionResponse;

    const authenticationJSON: AuthenticationResponseJSON = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: arrayBufferToBase64(assertionResponse.clientDataJSON),
        authenticatorData: arrayBufferToBase64(assertionResponse.authenticatorData),
        signature: arrayBufferToBase64(assertionResponse.signature),
        userHandle: assertionResponse.userHandle
          ? arrayBufferToBase64(assertionResponse.userHandle)
          : null,
      },
    };

    return authenticationJSON;
  } catch (error) {
    console.error('Passkey assertion failed:', error);
    throw error;
  }
};

/**
 * Verify authentication response server-side
 * Called from Cloud Function
 */
export const verifyPasskeyAssertion = async (
  authenticationJSON: AuthenticationResponseJSON,
  authenticationOptions: WebAuthnAuthenticationOptions,
  storedCredential: PasskeyCredential,
  expectedOrigin: string,
  expectedRPID: string
): Promise<boolean> => {
  try {
    const verification = await verifyAuthenticationResponse({
      response: authenticationJSON,
      expectedOrigin: expectedOrigin,
      expectedRPID: expectedRPID,
      expectedChallenge: authenticationOptions.challenge,
      authenticator: {
        credentialID: base64ToArrayBuffer(storedCredential.id),
        credentialPublicKey: storedCredential.publicKey,
        signCount: storedCredential.signCount,
      },
    });

    return verification.verified;
  } catch (error) {
    console.error('Passkey assertion verification failed:', error);
    return false;
  }
};

// ─── Utility Functions ───────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

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
