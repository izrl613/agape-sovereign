import { EnvelopeService, type UserSovereignProfile } from './envelopeService';

export enum AuthMethod {
  FEDERATED = 'FEDERATED',
  PASSKEY = 'PASSKEY',
  RECOVERY = 'RECOVERY',
}

export interface AuthSession {
  userId: string;
  method: AuthMethod;
  isAuthenticated: boolean;
  dek?: CryptoKey;
  lastHardwareVerification: number; // Timestamp of last passkey gesture
  sessionSecret: string; // High-entropy session-specific token
}

export class AuthService {
  private currentSession: AuthSession | null = null;
  private static HEARTBEAT_INTERVAL = 900000; // 15 minutes

  /**
   * In-memory enclave profile. This build does not persist an enclave yet, so
   * it stays null and unlock never fabricates key material. When the
   * persistence layer is wired, call `attachEnclave()` with the stored profile
   * to get real passkey/recovery validation.
   */
  private enclave: UserSovereignProfile | null = null;

  /** Attach a persisted enclave profile (future persistence layer). */
  attachEnclave(profile: UserSovereignProfile): void {
    this.enclave = profile;
  }

  /**
   * Layer 1: Federated Gate.
   * Establishes identity but does NOT unlock PII.
   */
  async loginFederated(provider: 'google' | 'apple'): Promise<AuthSession> {
    console.log(`[Security Layer 1] Authenticating via ${provider}...`);

    // Mocking Firebase Auth. CSPRNG only — never Math.random() for identifiers.
    const userId = `user_${globalThis.crypto.randomUUID()}`;

    this.currentSession = {
      userId,
      method: AuthMethod.FEDERATED,
      isAuthenticated: true,
      lastHardwareVerification: 0,
      sessionSecret: this.generateSessionSecret(),
    };

    return this.currentSession;
  }

  /**
   * Layer 2: Hardware Binding.
   * Unlocks the DEK using the physical passkey.
   */
  async unlockWithPasskey(passkeySecret: string): Promise<AuthSession> {
    return this.unlock(passkeySecret, AuthMethod.PASSKEY, false);
  }

  /**
   * Layer 3: Emergency Recovery.
   * Unlocks the DEK using the recovery code.
   */
  async unlockWithRecoveryCode(recoveryCode: string): Promise<AuthSession> {
    return this.unlock(recoveryCode, AuthMethod.RECOVERY, true);
  }

  /**
   * Shared unlock path. Fails closed: a bad secret against a real enclave
   * throws, and the absence of an enclave never yields a fabricated DEK.
   */
  private async unlock(
    secret: string,
    method: AuthMethod,
    isRecovery: boolean,
  ): Promise<AuthSession> {
    if (!this.currentSession) {
      throw new Error('Perimeter access required: login federated first');
    }
    if (typeof secret !== 'string' || secret.length === 0) {
      throw new Error('Unlock failed: a secret is required');
    }

    let dek: CryptoKey | undefined;
    if (this.enclave) {
      try {
        dek = await EnvelopeService.recoverDEK(this.enclave, secret, isRecovery);
      } catch {
        throw new Error(
          isRecovery
            ? 'Recovery Failure: Invalid recovery code entropy'
            : 'Hardware Binding Failure: Invalid Passkey gesture',
        );
      }
    }

    this.currentSession = {
      ...this.currentSession,
      method,
      dek,
      lastHardwareVerification: Date.now(),
    };

    return this.currentSession;
  }

  /**
   * High-Privilege Action Guard.
   * Requires a fresh hardware gesture if the heartbeat has expired.
   */
  async verifyPrivilege(actionType: 'EXPORT' | 'SENSITIVE_EDIT'): Promise<boolean> {
    if (!this.currentSession || !this.currentSession.dek) return false;

    const now = Date.now();
    const isFresh = (now - this.currentSession.lastHardwareVerification) < AuthService.HEARTBEAT_INTERVAL;

    if (!isFresh) {
      console.warn(`[Security] Heartbeat expired for ${actionType}. Re-verification required.`);
      return false;
    }

    return true;
  }

  private generateSessionSecret(): string {
    return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
