import { buffer } from '@types/node/buffer';

const bufferDecode = (value: string): ArrayBuffer => {
  return Buffer.from(value, 'base64');
};

const bufferEncode = (value: ArrayBuffer): string => {
  return Buffer.from(value).toString('base64');
};

export const startRegistration = async (username: string) => {
  const response = await fetch('/register/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });

  const options = await response.json();

  options.challenge = bufferDecode(options.challenge);
  options.user.id = bufferDecode(options.user.id);

  const credential = await navigator.credentials.create({
    publicKey: options,
  });

  return finishRegistration(credential);
};

const finishRegistration = async (credential: any) => {
  const response = await fetch('/register/finish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: credential.id,
      rawId: bufferEncode(credential.rawId),
      response: {
        attestationObject: bufferEncode(credential.response.attestationObject),
        clientDataJSON: bufferEncode(credential.response.clientDataJSON),
      },
      type: credential.type,
    }),
  });

  return response.json();
};

export const startLogin = async () => {
  const response = await fetch('/login/start', {
    method: 'POST',
  });

  const options = await response.json();

  options.challenge = bufferDecode(options.challenge);

  const credential = await navigator.credentials.get({
    publicKey: options,
  });

  return finishLogin(credential);
};

const finishLogin = async (credential: any) => {
  const response = await fetch('/login/finish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: credential.id,
      rawId: bufferEncode(credential.rawId),
      response: {
        authenticatorData: bufferEncode(credential.response.authenticatorData),
        clientDataJSON: bufferEncode(credential.response.clientDataJSON),
        signature: bufferEncode(credential.response.signature),
        userHandle: bufferEncode(credential.response.userHandle),
      },
      type: credential.type,
    }),
  });

  return response.json();
};
