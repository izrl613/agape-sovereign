import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';

export class PasskeyHandler {
  // In a real app, this would be a database
  private static userDb = new Map<string, any>();

  async handleRegistrationOptions(userId: string) {
    const options = await generateRegistrationOptions({
      rpName: 'Sovereign NYC',
      rpID: 'sovereign.nyc',
      userId: userId,
      userName: userId,
    });

    // Store challenge temporarily for verification
    this.saveChallenge(userId, options.challenge);
    return options;
  }

  async handleVerifyRegistration(userId: string, body: any) {
    const challenge = this.getChallenge(userId);
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedRPID: 'sovereign.nyc',
      expectedOrigin: 'https://sovereign.nyc',
    });

    if (verification.verified) {
      // Store the public key and credential ID
      this.userDb.set(userId, {
        credentialID: verification.registrationResponse.id,
        publicKey: verification.registrationResponse.publicKey,
      });
      return { success: true };
    }
    throw new Error('Verification failed');
  }

  async handleAuthenticationOptions(userId: string) {
    const user = this.userDb.get(userId);
    if (!user) throw new Error('User not registered');

    const options = await generateAuthenticationOptions({
      rpID: 'sovereign.nyc',
      allowCredentials: [{
        id: user.credentialID,
        type: 'public-key',
      }],
      userVerification: 'required',
    });

    this.saveChallenge(userId, options.challenge);
    return options;
  }

  async handleVerifyAuthentication(userId: string, body: any) {
    const user = this.userDb.get(userId);
    const challenge = this.getChallenge(userId);

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedRPID: 'sovereign.nyc',
      expectedOrigin: 'https://sovereign.nyc',
      expectedPublicKey: user.publicKey,
    });

    if (verification.verified) {
      return { success: true };
    }
    throw new Error('Authentication failed');
  }

  private saveChallenge(userId: string, challenge: string) {
    // Implementation for temporary storage (e.g., Redis)
    console.log(`Saved challenge for ${userId}: ${challenge}`);
  }

  private getChallenge(userId: string): string {
    // Implementation for temporary storage retrieval
    return 'mock-challenge';
  }
}

export const passkeyHandler = new PasskeyHandler();
