import { Firestore } from 'firebase-admin/firestore';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
const base64url = {
  encode: (arr: Uint8Array) => Buffer.from(arr).toString('base64url'),
  decode: (str: string) => Buffer.from(str, 'base64url'),
};

// Initialize Firestore (admin SDK assumed to be initialized elsewhere)
const db = new Firestore();

/**
 * Helper to get a reference to a user's passkey collection.
 */
function getUserPasskeysRef(uid: string) {
  return db.collection('users').doc(uid).collection('passkeys');
}

/**
 * Generate registration (creation) options for a given user.
 * Returns the options object that should be passed to navigator.credentials.create().
 */
export async function getRegistrationOptions(uid: string) {
  // Retrieve existing credentials to exclude duplicates
  const existing = await getUserPasskeysRef(uid).get();
  const existingCredentials = existing.docs.map((doc) => ({
    id: doc.id,
    type: 'public-key' as const,
    transports: ['internal', 'usb', 'ble', 'nfc'],
  }));

  const options = await generateRegistrationOptions({
    rpName: 'Agape Sovereign',
    rpID: 'aitnyc.cloudflareaccess.com', // domain of the app
    userID: new TextEncoder().encode(uid),
    userName: uid,
    timeout: 60000,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
    excludeCredentials: existingCredentials,
  });

  // Store the challenge temporarily (in memory or a short‑lived collection)
  await getUserPasskeysRef(uid).doc('_challenge').set({ challenge: options.challenge });
  return options;
}

/**
 * Verify a registration response from the client and store the credential.
 */
export async function verifyAndStoreRegistration(uid: string, attestationResponse: any) {
  const challengeDoc = await getUserPasskeysRef(uid).doc('_challenge').get();
  if (!challengeDoc.exists) {
    throw new Error('Challenge not found for user');
  }
  const expectedChallenge = challengeDoc.data()?.challenge;
  const verification = await verifyRegistrationResponse({
    credential: attestationResponse,
    expectedChallenge,
    expectedOrigin: `https://${process.env.CF_ACCESS_DOMAIN}`,
    expectedRPID: 'aitnyc.cloudflareaccess.com',
  });

  if (!verification.verified) {
    throw new Error('Passkey registration verification failed');
  }

  const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
  const credIdBase64 = base64url.encode(credentialID);

  // Store credential metadata (public key, counter) under the user's collection
  await getUserPasskeysRef(uid).doc(credIdBase64).set({
    credentialPublicKey: base64url.encode(credentialPublicKey),
    counter,
    transports: attestationResponse.response?.transports || [],
  });

  // Clean up challenge
  await getUserPasskeysRef(uid).doc('_challenge').delete();
  return { success: true };
}

/**
 * Generate authentication (login) options for a user.
 */
export async function getAuthenticationOptions(uid: string) {
  const credsSnapshot = await getUserPasskeysRef(uid).get();
  const allowCredentials = credsSnapshot.docs.map((doc) => ({
    id: base64url.decode(doc.id),
    type: 'public-key' as const,
    transports: doc.data()?.transports || ['internal'],
  }));

  const options = await generateAuthenticationOptions({
    timeout: 60000,
    rpID: 'aitnyc.cloudflareaccess.com',
    allowCredentials,
    userVerification: 'preferred',
  });

  // Store challenge for later verification
  await getUserPasskeysRef(uid).doc('_auth_challenge').set({ challenge: options.challenge });
  return options;
}

/**
 * Verify the authentication response and return a Firebase custom token.
 */
export async function verifyAuthentication(uid: string, assertionResponse: any) {
  const challengeDoc = await getUserPasskeysRef(uid).doc('_auth_challenge').get();
  if (!challengeDoc.exists) {
    throw new Error('Authentication challenge missing');
  }
  const expectedChallenge = challengeDoc.data()?.challenge;

  // Find stored credential data for the credential ID presented
  const credIdBase64 = base64url.encode(assertionResponse.id);
  const storedCredDoc = await getUserPasskeysRef(uid).doc(credIdBase64).get();
  if (!storedCredDoc.exists) {
    throw new Error('Unknown credential');
  }
  const stored = storedCredDoc.data();

  const verification = await verifyAuthenticationResponse({
    credential: assertionResponse,
    expectedChallenge,
    expectedOrigin: `https://${process.env.CF_ACCESS_DOMAIN}`,
    expectedRPID: 'aitnyc.cloudflareaccess.com',
    authenticator: {
      credentialPublicKey: base64url.decode(stored?.credentialPublicKey),
      counter: stored?.counter || 0,
      credentialDeviceType: 'singleDevice',
      credentialBackedUp: false,
    },
  });

  if (!verification.verified) {
    throw new Error('Passkey authentication failed');
  }

  // Update stored counter to prevent replay attacks
  await storedCredDoc.ref.update({ counter: verification.authenticationInfo.newCounter });
  await getUserPasskeysRef(uid).doc('_auth_challenge').delete();

  // Generate a Firebase custom token for the user (admin SDK) – assumes admin SDK initialized
  const { getAuth } = await import('firebase-admin/auth');
  const customToken = await getAuth().createCustomToken(uid);
  return { customToken };
}
