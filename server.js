const express = require('express');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { Fido2Lib } = require('fido2-lib');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');

const app = express();

// Use express.json() to parse JSON bodies
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: 'your-secret-key', // Replace with a strong, random secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }, // Set to true if using HTTPS
  })
);

// Cloud Run provides the port via the PORT environment variable.
const PORT = process.env.PORT || 8080;

// Instantiates a client
const secretManagerClient = new SecretManagerServiceClient();

async function accessSecretVersion() {
  const [version] = await secretManagerClient.accessSecretVersion({
    name: 'projects/agape-sovereign-enclave/secrets/GEMINI_API_KEY/versions/latest',
  });

  // Extract the payload as a string.
  const payload = version.payload.data.toString();

  return payload;
}

// FIDO2 (WebAuthn) Configuration
const fido2 = new Fido2Lib({
  timeout: 60000,
  rpId: 'sovereign.nyc',
  rpName: 'Agape Sovereign Enclave',
  challengeSize: 128,
  attestation: 'direct',
  cryptoParams: [-7, -257],
  authenticatorAttachment: 'platform',
  authenticatorRequireResidentKey: false,
  authenticatorUserVerification: 'required',
});

// In-memory user store (for demonstration purposes)
const userStore = {};

app.get('/', (req, res) => {
  res.send('Welcome to the Agape Sovereign Enclave!');
});

// Registration - Start
app.post('/register/start', async (req, res) => {
  const id = uuidv4();
  const name = `user-${id}`;
  const displayName = `User ${id}`;

  const user = {
    id,
    name,
    displayName,
    authenticators: [],
  };

  userStore[id] = user;

  const registrationOptions = await fido2.attestationOptions();
  registrationOptions.user = user;

  req.session.challenge = registrationOptions.challenge;
  req.session.userId = id;

  res.json(registrationOptions);
});

// Registration - Finish
app.post('/register/finish', async (req, res) => {
  const { id, rawId, response, type } = req.body;

  const challenge = req.session.challenge;
  const userId = req.session.userId;

  const attestationExpectations = {
    challenge,
    origin: 'https://sovereign.nyc',
    factor: 'either',
  };

  const regResult = await fido2.attestationResult(
    req.body,
    attestationExpectations
  );

  const newAuthenticator = {
    ...regResult.authnr,
    id: Buffer.from(rawId, 'base64').toString('hex'),
  };

  userStore[userId].authenticators.push(newAuthenticator);

  res.json({ status: 'ok' });
});

// Login - Start
app.post('/login/start', async (req, res) => {
  const assertionOptions = await fido2.assertionOptions();
  req.session.challenge = assertionOptions.challenge;
  res.json(assertionOptions);
});

// Login - Finish
app.post('/login/finish', async (req, res) => {
  const { id, rawId, response, type } = req.body;
  const challenge = req.session.challenge;
  const user = Object.values(userStore).find(u => u.authenticators.some(a => a.id === id));

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const authnr = user.authenticators.find(a => a.id === id);

  const assertionExpectations = {
    challenge,
    origin: 'https://sovereign.nyc',
    factor: 'either',
    publicKey: authnr.publicKey,
    prevCounter: authnr.counter,
    userHandle: user.id,
  };

  const assertionResult = await fido2.assertionResult(
    req.body,
    assertionExpectations
  );

  authnr.counter = assertionResult.authnr.counter;

  req.session.userId = user.id;

  res.json({ status: 'ok' });
});

// Enable gzip compression for faster ESM module delivery
app.use(compression());

// Standard logging for Cloud Logging integration
app.use(morgan('combined'));

// Health check endpoint for Cloud Run/GCLB
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.post('/api/gemini', async (req, res) => {
  try {
    const apiKey = await accessSecretVersion();
    // TODO: Add call to Gemini API using the apiKey
    res.status(200).send({ message: 'Successfully retrieved API key.' });
  } catch (error) {
    console.error('Error accessing secret:', error);
    res.status(500).send({ message: 'Error accessing secret.' });
  }
});

// Serve static files from the root directory
// This allows the browser to find index.tsx and other assets
app.use(express.static(path.join(__dirname)));

// SPA Routing: All requests that don't match a static file 
// are sent to index.html so React can handle the routing.
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`
  💎 AGAPE SOVEREIGN ENCLAVE 💎
  --------------------------------------------------
  STATUS: ALPHA BUILD ONLINE
  VERSION: 2026.5.0
  PORT: ${PORT}
  PLATFORM: Google Cloud Run
  --------------------------------------------------
  One Love. Agape Love. Sovereign #2026
  `);
});

// Graceful shutdown for Cloud Run
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
