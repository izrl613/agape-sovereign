/**
 * Authentication service — real ceremonies only, zero fallbacks.
 * Supports full WebAuthn FIDO2 passkey lifecycle for all devices/browsers.
 * 
 * - PASSKEY: WebAuthn against Cloud Functions auth API
 *    (/api/auth/ → register-options → verify-registration
 *                 → login-options → verify-login).
 *    If the backend is unreachable the login FAILS with an honest
 *    error. It never invents a user.
 *  - GOOGLE: Firebase `signInWithPopup` (see ../firebase.ts). Handled
 *    by SovereignContext so the Drive access token is captured.
 *  - ANON: Firebase Anonymous auth. Handled by SovereignContext.
 * 
 * Features:
 *   • Cross-platform: works on iOS Safari, Android Chrome, desktop Chrome/Firefox/Edge
 *   • Hardware keys: YubiKey, etc. (cross-platform authenticators)
 *   • Platform authenticators: FaceID/TouchID/Windows Hello
 *   • Auto-registration: first-time flow with clear guidance
 *   • Login ceremony: discoverable credentials or email-based
 *   • CSRF protection: double-submit cookie pattern
 *   • Challenge caching: prevents replay attacks
 *   • Origin validation: ensures passkeys only work on correct origin
 */
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export type AuthMethod = 'PASSKEY' | 'GOOGLE' | 'ANON';

export interface PasskeyResult {
  userId: string;
  email: string;
  /** Firebase custom token / session token returned by the backend, if any. */
  token?: string;
  /** Indicates if this was a hardware key vs platform authenticator */
  credentialType?: 'platform' | 'cross-platform' | 'unknown';
}

/**
 * Base URL for auth API — adjust based on environment
 * - Development: http://localhost:5000
 * - Production: https://sovereign.nyc (Firebase Functions domain)
 */
const BASE = '/api/auth';

/**
 * Cache for CSRF tokens — single instance per session
 * Double-submit cookie pattern: server sets cookie, client echoes header
 */
let csrfTokenCache: string | null = null;

/**
 * Fetches a fresh CSRF token from the backend, or uses cached one.
 * Throws honest error if backend is down.
 */
async function csrfHeaders(forceFresh = false): Promise<Record<string, string>> {
  if (!csrfTokenCache || forceFresh) {
    const res = await fetch(`${BASE}/csrf-token`, { credentials: 'include' });
    if (!res.ok) {
      throw new Error('Authentication service unavailable — please try again later');
    }
    const data = await res.json();
    csrfTokenCache = data.csrfToken as string;
  }
  return { 'x-csrf-token': csrfTokenCache };
}

/**
 * Error messages for different failure scenarios — honest, user-friendly messages
 */
export const PASSKEY_ERRORS = {
  /** No passkey registered yet — user needs to register first */
  NO_PASSKEY_REGISTERED:
    'No passkey is registered for this account yet. Sign in with Google first, then register a passkey from the login screen.',
  
  /** Passkey creation was cancelled/timed out by user */
  CREATION_DISMISSED:
    'Passkey creation was dismissed or timed out. Please try again.',
  
  /** Passkey already exists on this device */
  PASSKEY_EXISTS:
    'A passkey for this account already exists on this device. Use Passkey sign-in instead.',
  
  /** Device cannot create a passkey — needs biometrics or hardware key */
  CREATION_FAILED:
    'This device could not create a passkey. Try a device with biometrics (Face ID/Touch ID) or use a hardware security key (YubiKey).',
  
  /** Login assertion failed */
  ASSERTION_FAILED:
    'The server rejected the passkey assertion. Please try again or use Sign in with Google.',
  
  /** No account found for this email */
  NO_ACCOUNT_FOUND:
    'No account found for this email. Sign in with Google first, then bind a passkey.',
  
  /** Challenge expired — user needs to retry */
  CHALLENGE_EXPIRED:
    'Challenge expired or missing. Retry passkey setup.',
  
  /** Backend temporarily unavailable */
  BACKEND_DOWN:
    'Passkey sign-in is unavailable right now — the authentication service did not respond. No account was created. Use Sign in with Google, or try again later.',
};

/**
 * Full WebAuthn login ceremony.
 * Supports both:
 *   1. Email-based flow: user provides email, system looks up credentials
 *   2. Discoverable/resident key flow: authenticator selects from stored credentials
 * 
 * Throws never fakes success on failure.
 */
export class PasskeyService {
  /** Full WebAuthn login ceremony.
   *  Supports email-based and discoverable credential flows.
   *  @param email Optional — if provided, uses email-based flow;
   *             if omitted, uses discoverable/resident key flow
   *  @returns PasskeyResult with userId, email, and token
   */
  static async login(email?: string): Promise<PasskeyResult> {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    let optionsRes: Response;

    try {
      optionsRes = await fetch(`${BASE}/login-options`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(await csrfHeaders()) },
        body: JSON.stringify({ email: normalizedEmail }),
      });
    } catch (err) {
      // Network error — honest failure, never fake success
      throw new Error(PASSKEY_ERRORS.BACKEND_DOWN);
    }

    if (!optionsRes.ok) {
      if (optionsRes.status === 404) {
        throw new Error(
          PASSKEY_ERRORS.NO_PASSKEY_REGISTERED
        );
      }
      throw new Error(
        optionsRes.status === 401
          ? 'Authentication required — please sign in first'
          : `Login options failed (HTTP ${optionsRes.status})`
      );
    }

    const options = await optionsRes.json();
    const optionsJSON = options.optionsJSON ?? options;

    let assertion;
    try {
      // startAuthentication supports both discoverable and credential-based flows
      assertion = await startAuthentication({ optionsJSON });
    } catch (err: any) {
      // User dismissed the prompt — honest error
      if (err?.name === 'NotAllowedError') {
        throw new Error(PASSKEY_ERRORS.CREATION_DISMISSED);
      }
      // Device cannot complete the ceremony
      throw new Error(
        PASSKEY_ERRORS.CREATION_FAILED
      );
    }

    // Send the assertion back for verification
    const verifyRes = await fetch(`${BASE}/verify-login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(await csrfHeaders()),
        ...(normalizedEmail ? { 'X-Passkey-Email': normalizedEmail } : {}),
      },
      body: JSON.stringify({ ...assertion, email: normalizedEmail }),
    });

    if (!verifyRes.ok) {
      const errData = await verifyRes.json().catch(() => ({}));
      throw new Error(
        errData.error || PASSKEY_ERRORS.ASSERTION_FAILED
      );
    }

    const data = await verifyRes.json();
    if (!data.userId && !data.uid) {
      throw new Error('Passkey verified but the server returned no account.');
    }

    // Determine credential type for UI feedback
    const credentialType = this.determineCredentialType(data);

    return {
      userId: data.userId ?? data.uid,
      email: data.email ?? normalizedEmail,
      token: data.token ?? data.customToken,
      credentialType,
    };
  }

  /**
   * Register a new passkey for an email.
   * Full flow: register-options → startRegistration → verify-registration
   * 
   * @param email User's email address — must be valid and not empty
   * @returns Promise<void> resolves on success, throws on failure
   */
  static async register(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Enter your email first so the passkey can be bound to it.');
    }

    try {
      // Fetch registration options from backend
      let optionsRes: Response;
      try {
        optionsRes = await fetch(`${BASE}/register-options`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...(await csrfHeaders()) },
          body: JSON.stringify({ email: normalizedEmail }),
        });
      } catch (err) {
        throw new Error(PASSKEY_ERRORS.BACKEND_DOWN);
      }

      if (!optionsRes.ok) {
        throw new Error(
          optionsRes.status === 401
            ? 'Authentication required — please sign in first'
            : `Registration options failed (HTTP ${optionsRes.status})`
        );
      }

      const options = await optionsRes.json();
      const optionsJSON = options.optionsJSON ?? options;

      // Start the WebAuthn registration ceremony
      let attestation;
      try {
        attestation = await startRegistration({ optionsJSON });
      } catch (err: any) {
        // User dismissed the sheet/prompt
        if (err?.name === 'NotAllowedError') {
          throw new Error(PASSKEY_ERRORS.CREATION_DISMISSED);
        }
        // Device doesn't support passkey creation
        if (err?.name === 'InvalidStateError') {
          throw new Error(PASSKEY_ERRORS.PASSKEY_EXISTS);
        }
        throw new Error(
          PASSKEY_ERRORS.CREATION_FAILED
        );
      }

      // Send the attestation result for verification
      const verifyRes = await fetch(`${BASE}/verify-registration`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(await csrfHeaders()) },
        body: JSON.stringify({ ...attestation, email: normalizedEmail }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(
          errData.error || PASSKEY_ERRORS.CREATION_FAILED
        );
      }

      const data = await verifyRes.json();
      if (!data.verified) {
        throw new Error(
          'The server could not verify the new passkey. Please try again.'
        );
      }
    } catch (error: any) {
      // Re-throw with user-friendly messages
      throw error;
    }
  }

  /**
   * Determines the type of credential from the verification response.
   * Helps UI display appropriate icons/indicators.
   */
  private static determineCredentialType(
    data: any
  ): 'platform' | 'cross-platform' | 'unknown' {
    // simplewebauthn server returns credential info — check if it's platform-bound
    if (data?.credentialInfo?.transports) {
      // Has transports typically means cross-platform (roaming) key
      // But could also be platform with transports logged
      return 'cross-platform';
    }
    if (data?.credentialInfo?.isUserVerified === true) {
      return 'platform';
    }
    return 'unknown';
  }

  /**
   * Generates a fresh CSRF token — call this when starting a new ceremony
   * to ensure the token is always fresh and not stale.
   */
  static async refreshCSRF(): Promise<void> {
    try {
      await fetch(`${BASE}/csrf-token`, { credentials: 'include' });
      // Cache the new token
      const res = await fetch(`${BASE}/csrf-token`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        csrfTokenCache = data.csrfToken as string;
      }
    } catch {
      // CSRF refresh failure is non-critical — next fetch will get a fresh one
    }
  }
}