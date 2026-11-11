import { SovereignEncryption, type WrappedDEK } from '../lib/encryption.ts';

export interface UserSovereignProfile {
  userId: string;
  wrappedDekPasskey: WrappedDEK;
  wrappedDekRecovery: WrappedDEK;
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  integrityHash: string;
}

export class EnvelopeService {
  /**
   * Initializes a new sovereign profile for a user.
   * This is the "Binding Ceremony".
   */
  static async createInitialProfile(
    userId: string,
    passkeySecret: string,
    recoverySecret: string,
    initialData: string
  ): Promise<UserSovereignProfile> {
    const dek = await SovereignEncryption.generateSovereignDEK();

    // 1. Wrap DEK with Passkey
    const passkeySalt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const passkeyWrappingKey = await SovereignEncryption.deriveWrappingKey(passkeySecret, passkeySalt);
    const wrappedDekPasskey = await SovereignEncryption.wrapSovereignDEK(dek, passkeyWrappingKey);

    // 2. Wrap DEK with Recovery Code
    const recoverySalt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const recoveryWrappingKey = await SovereignEncryption.deriveWrappingKey(recoverySecret, recoverySalt);
    const wrappedDekRecovery = await SovereignEncryption.wrapSovereignDEK(dek, recoveryWrappingKey);

    // 3. Encrypt Initial Data
    const { ciphertext, iv } = await SovereignEncryption.encryptPII(initialData, dek);

    // 4. Generate Integrity Hash (Including Layer 3: Server-Side Pepper)
    const SOVEREIGN_PEPPER = 'agape-server-secret-pepper-2026';
    const integrityHash = await SovereignEncryption.generateIntegrityHash('profile_init', initialData, userId, SOVEREIGN_PEPPER);

    return {
      userId,
      wrappedDekPasskey: { ...wrappedDekPasskey, salt: passkeySalt },
      wrappedDekRecovery: { ...wrappedDekRecovery, salt: recoverySalt },
      encryptedData: ciphertext,
      iv: iv,
      integrityHash: integrityHash
    };
  }

  /**
   * Decrypts a user's sovereign profile using either a passkey or recovery code.
   */
  static async decryptProfile(
    profile: UserSovereignProfile,
    secret: string,
    isRecoveryPath: boolean = false
  ): Promise<string> {
    const wrapped = isRecoveryPath ? profile.wrappedDekRecovery : profile.wrappedDekPasskey;

    // Derive wrapping key using the provided secret and the stored salt
    const wrappingKey = await SovereignEncryption.deriveWrappingKey(secret, wrapped.salt);

    // Unwrap the DEK
    const dek = await SovereignEncryption.unwrapSovereignDEK(wrapped, wrappingKey);

    // Decrypt the data
    return await SovereignEncryption.decryptPII(profile.encryptedData, profile.iv, dek);
  }

  /**
   * Recovers the Data Encryption Key (DEK) without decrypting payload data.
   * Used by the hardware-binding / recovery unlock paths.
   */
  static async recoverDEK(
    profile: UserSovereignProfile,
    secret: string,
    isRecoveryPath: boolean = false
  ): Promise<CryptoKey> {
    const wrapped = isRecoveryPath ? profile.wrappedDekRecovery : profile.wrappedDekPasskey;
    const wrappingKey = await SovereignEncryption.deriveWrappingKey(secret, wrapped.salt);
    return SovereignEncryption.unwrapSovereignDEK(wrapped, wrappingKey);
  }

  /**
   * Updates the encrypted data in a profile while maintaining the same DEK.
   */
  static async updateProfileData(
    profile: UserSovereignProfile,
    secret: string,
    newData: string
  ): Promise<UserSovereignProfile> {
    // We need the DEK to encrypt new data
    const wrapped = profile.wrappedDekPasskey;
    const wrappingKey = await SovereignEncryption.deriveWrappingKey(secret, wrapped.salt);
    const dek = await SovereignEncryption.unwrapSovereignDEK(wrapped, wrappingKey);

    const { ciphertext, iv } = await SovereignEncryption.encryptPII(newData, dek);
    // 4. Generate Integrity Hash (Including Layer 3: Server-Side Pepper)
    const SOVEREIGN_PEPPER = 'agape-server-secret-pepper-2026';
    const integrityHash = await SovereignEncryption.generateIntegrityHash('profile_update', newData, profile.userId, SOVEREIGN_PEPPER);

    return {
      ...profile,
      encryptedData: ciphertext,
      iv: iv,
      integrityHash: integrityHash
    };
  }
}
