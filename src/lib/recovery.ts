/**
 * Recovery Code Utility
 * Generates 120-bit entropy recovery strings for emergency DEK unwrapping.
 */

export class RecoveryUtils {
  /**
   * Generates a cryptographically secure 120-bit entropy string.
   * Format: 20 alphanumeric characters.
   */
  static generateRecoveryCode(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    const randomValues = new Uint32Array(20);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < 20; i++) {
      code += charset[randomValues[i] % charset.length];
    }

    return code;
  }

  /**
   * Validates the format of a recovery code.
   */
  static isValidCode(code: string): boolean {
    return code.length === 20 && /^[A-Za-z0-9]+$/.test(code);
  }
}
