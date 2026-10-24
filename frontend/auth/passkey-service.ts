import {
  startRegistration,
  startAuthentication,
  verifyRegistrationResponse,
  verifyAuthenticationResponse
} from '@simplewebauthn/browser';

export type AuthMethod = 'PASSKEY' | 'GOOGLE' | 'ANON';

export class PasskeyService {
  private static BASE_URL = '/api/auth';

  /**
   * Triple-Path Authentication
   */
  async authenticate(method: AuthMethod) {
    switch (method) {
      case 'PASSKEY':
        return this.doPasskeyAuth();
      case 'GOOGLE':
        return this.doGoogleAuth();
      case 'ANON':
        return this.doAnonBypass();
    }
  }

  private async doPasskeyAuth() {
    const optionsResponse = await fetch(`${PasskeyService.BASE_URL}/generate-authentication-options`);
    const options = await optionsResponse.json();
    const authResponse = await startAuthentication(options);
    const verification = await fetch(`${PasskeyService.BASE_URL}/verify-authentication`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authResponse),
    });
    return await verification.json();
  }

  private async doGoogleAuth() {
    // Integration with Google OAuth2
    console.log('Redirecting to Google Sign-in...');
    window.location.href = `${PasskeyService.BASE_URL}/google-login`;
    return { status: 'redirecting' };
  }

  private async doAnonBypass() {
    console.log('Granting anonymous session access...');
    return { success: true, sessionType: 'anonymous', userId: `anon_${Date.now()}` };
  }

  async register() {
    const optionsResponse = await fetch(`${PasskeyService.BASE_URL}/generate-registration-options`);
    const options = await optionsResponse.json();
    const regResponse = await startRegistration(options);
    const verification = await fetch(`${PasskeyService.BASE_URL}/verify-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regResponse),
    });
    return await verification.json();
  }
}

export const passkeyService = new PasskeyService();
