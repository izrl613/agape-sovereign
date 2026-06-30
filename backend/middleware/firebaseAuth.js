/**
 * Firebase Auth Middleware — Backend
 * Agape Sovereign Enclave 2026
 *
 * Verifies Firebase ID tokens from the `Authorization: Bearer <token>` header.
 * Attach to any route that needs authenticated Firebase users.
 *
 * Usage:
 *   import { requireFirebaseAuth } from './middleware/firebaseAuth.js';
 *   app.get('/api/protected', requireFirebaseAuth, (req, res) => {
 *     const uid = req.firebaseUser.uid;
 *     ...
 *   });
 */

import { auth } from '../services/firebase-admin.js';

/**
 * Middleware: Require a valid Firebase ID token.
 * Sets `req.firebaseUser` with the decoded token on success.
 * Returns 401 if missing/invalid, 403 if token is revoked.
 */
export async function requireFirebaseAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected: Bearer <Firebase ID Token>',
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // checkRevoked: true ensures we reject tokens that have been revoked
    const decodedToken = await auth.verifyIdToken(idToken, /* checkRevoked */ true);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('[Firebase Auth Middleware] Token verification failed:', error.code || error.message);

    if (error.code === 'auth/id-token-revoked') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Firebase ID token has been revoked. Please sign in again.',
      });
    }

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Firebase ID token has expired. Please refresh your token.',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid Firebase ID token.',
    });
  }
}

/**
 * Middleware: Optionally verify Firebase ID token.
 * If a valid token is present, `req.firebaseUser` is set.
 * If no token or invalid token, request continues without auth (req.firebaseUser = null).
 * Useful for routes that have different behavior for authenticated vs anonymous users.
 */
export async function optionalFirebaseAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.firebaseUser = null;
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken, true);
    req.firebaseUser = decodedToken;
  } catch (error) {
    req.firebaseUser = null;
  }

  next();
}
