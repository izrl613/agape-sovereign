const express = require('express');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');

const app = express();

// Cloud Run provides the port via the PORT environment variable.
const PORT = process.env.PORT || 8080;

// Enable gzip compression for faster ESM module delivery
app.use(compression());

// Standard logging for Cloud Logging integration
app.use(morgan('combined'));

// Health check endpoint for Cloud Run/GCLB
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
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
