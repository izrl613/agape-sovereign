/**
 * Authentication service — real ceremonies only, zero fallbacks.
 *
 *  - PASSKEY: WebAuthn against the Cloud Functions auth API
 *    (/api/auth/login-options → startAuthentication → /verify-login).
 *    If the backend is unreachable the login FAILS with an honest
 *    error. It never invents a user.
 *  - GOOGLE: Firebase `signInWithPopup` (see ../firebase.ts). Handled
 *    by SovereignContext so the Drive access token is captured.
 *  - ANON: Firebase Anonymous auth. Handled by SovereignContext.
 */
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export type AuthMethod = 'PASSKEY' | 'GOOGLE' | 'ANON';

export interface PasskeyResult {
  userId: string;
  email: string;
  /** Firebase custom token / session token returned by the backend, if any. */
  token?: string;
}

const BASE = '/api/auth';

export const PASSKEY_BACKEND_DOWN =
  'Passkey sign-in is unavailable right now — the authentication service did not respond. No account was created. Use Sign in with Google, or try again later.';

export class PasskeyService {
  /** Full WebAuthn login ceremony. Throws (never fakes success) on failure. */
  static async login(email?: string): Promise<PasskeyResult> {
    const normalizedEmail = (email ?? '').trim().toLowerCase();

    let optionsRes: Response;
    try {
      optionsRes = await fetch(`${BASE}/login-options`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
    } catch {
      throw new Error(PASSKEY_BACKEND_DOWN);
    }
    if (!optionsRes.ok) {
      if (optionsRes.status === 404) {
        throw new Error(
          'No passkey is registered for this account yet. Sign in with Google first, then register a passkey from the dashboard — or register one now from the login screen.',
        );
      }
      throw new Error(PASSKEY_BACKEND_DOWN);
    }
    const options = await optionsRes.json();
    const optionsJSON = options.optionsJSON ?? options;

    let assertion;
    try {
      assertion = await startAuthentication({ optionsJSON });
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') throw new Error('Passkey prompt was dismissed or timed out. Nothing was signed.');
      throw new Error('This device could not complete the passkey ceremony. Try a device with biometrics or a hardware security key.');
    }

    const verifyRes = await fetch(`${BASE}/verify-login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(normalizedEmail ? { 'X-Passkey-Email': normalizedEmail } : {}),
      },
      body: JSON.stringify({ ...assertion, email: normalizedEmail }),
    });
    if (!verifyRes.ok) throw new Error('The server rejected the passkey assertion. Please try again.');
    const data = await verifyRes.json();
    if (!data.userId && !data.uid) throw new Error('Passkey verified but the server returned no account. Please contact support.');
    return {
      userId: data.userId ?? data.uid,
      email: data.email ?? normalizedEmail,
      token: data.token ?? data.customToken,
    };
  }

  /** Register a new passkey for an email (creates the credential server-side). */
  static async register(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Enter your email first so the passkey can be bound to it.');

    let optionsRes: Response;
    try {
      optionsRes = await fetch(`${BASE}/register-options`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
    } catch {
      throw new Error(PASSKEY_BACKEND_DOWN);
    }
    if (!optionsRes.ok) throw new Error(PASSKEY_BACKEND_DOWN);
    const options = await optionsRes.json();
    const optionsJSON = options.optionsJSON ?? options;

    let attestation;
    try {
      attestation = await startRegistration({ optionsJSON });
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') throw new Error('Passkey creation was dismissed or timed out.');
      if (err?.name === 'InvalidStateError') throw new Error('A passkey for this account already exists on this device. Use Passkey sign-in instead.');
      throw new Error('This device could not create a passkey. Try a device with biometrics or a hardware security key.');
    }

    const verifyRes = await fetch(`${BASE}/verify-registration`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...attestation, email: normalizedEmail }),
    });
    if (!verifyRes.ok) throw new Error('The server could not verify the new passkey. Please try again.');
  }
}
