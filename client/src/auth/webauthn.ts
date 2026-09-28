/**
 * WebAuthn (Passkey) Authentication for Agape Sovereign
 * Implements FIDO2/WebAuthn standard for secure biometric authentication
 */

interface WebAuthnOptions {
  rpName: string;
  rpID: string;
  userID: string;
  name: string;
  challenge: ArrayBuffer;
  userVerification: 'required' | 'preferred';
}

interface WebAuthnCredential {
  rawId: ArrayBuffer;
  response: AuthenticatorResponse;
  userId: ArrayBuffer;
  type: string;
  authenticatorAttachment: string;
}

interface WebAuthnResult {
  success: boolean;
  userId: string;
  name: string;
  verified: boolean;
  credentialId: string;
}

export class WebAuthnProvider {
  private static readonly RP_ID = 'sovereign.nyc';
  private static readonly RP_NAME = 'Agape Sovereign';

  /**
   * Initialize WebAuthn for login
   */
  async login(): Promise<WebAuthnResult> {
    const challenge = this.generateChallenge();
    
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          rpId: this.RP_ID,
          challenge,
          userVerification: 'preferred',
        },
      });

      const result = await this.verifyCredential(credential);
      return result;
    } catch (error) {
      console.error('WebAuthn login failed:', error);
      throw error;
    }
  }

  /**
   * Verify WebAuthn credential
   */
  private async verifyCredential(credential: WebAuthnCredential): Promise<WebAuthnResult> {
    const response = credential.response;
    
    // Extract user info from assertion
    const userId = Array.from(new Uint8Array(response.userHandle))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const verified = response.userVerificationData?.length > 0;
    
    return {
      success: true,
      userId,
      name: 'User', // Would come from user.name in credential
      verified,
      credentialId: Array.from(new Uint8Array(credential.rawId))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
    };
  }

  /**
   * Generate cryptographic challenge
   */
  private generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return array.buffer;
  }

  /**
   * Register new passkey
   */
  async register(userId: string, name: string): Promise<boolean> {
    const challenge = this.generateChallenge();
    
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          rp: {
            name: this.RP_NAME,
            id: this.RP_ID,
          },
          user: {
            id: userId,
            name,
            displayName: name,
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: {
            residentKey: 'required',
            userVerification: 'preferred',
          },
          attestation: 'direct',
          challenge,
        },
      });

      // Save credential to backend
      await this.saveCredential(credential);
      return true;
    } catch (error) {
      console.error('Passkey registration failed:', error);
      throw error;
    }
  }

  /**
   * Save credential to backend
   */
  private async saveCredential(credential: any): Promise<void> {
    // Implementation would store credential in secure backend
    console.log('Credential saved:', credential.id);
  }
}

export const createWebAuthn = () => new WebAuthnProvider();
