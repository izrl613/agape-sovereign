import type { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Cloudflare Access JWKS URL (public);
const JWKS_URL = 'https://<YOUR-CLOUDFLARE-TEAM>.cloudflareaccess.com/cdn-cgi/access/certs'; // replace with actual team domain

// Cache the JWKS keys for a short period
let cachedKeys: any[] = [];
let lastFetch = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getJwks(): Promise<any[]> {
  const now = Date.now();
  if (cachedKeys.length && now - lastFetch < CACHE_TTL_MS) {
    return cachedKeys;
  }
  const resp = await fetch(JWKS_URL);
  if (!resp.ok) {
    throw new Error(`Failed to fetch Cloudflare JWKS: ${resp.status}`);
  }
  const data = await resp.json();
  cachedKeys = data.keys || [];
  lastFetch = now;
  return cachedKeys;
}

function getKey(kid: string, keys: any[]): string | null {
  const key = keys.find((k) => k.kid === kid);
  if (!key) return null;
  // Build PEM from JWK (simple case for RSA)
  const pubKey = jwkToPem(key);
  return pubKey;
}

// Minimal JWK to PEM conversion (RSA only)
function jwkToPem(jwk: any): string {
  const { n, e } = jwk;
  const modulus = Buffer.from(n, 'base64');
  const exponent = Buffer.from(e, 'base64');
  // Use crypto module to create public key
  const pubKeyObj = crypto.createPublicKey({
    key: {
      kty: 'RSA',
      n: modulus,
      e: exponent,
    },
    format: 'jwk',
  });
  return pubKeyObj.export({ type: 'spki', format: 'pem' }).toString();
}

export async function cloudflareAccessMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['cf-access-token'] || req.headers['authorization'];
  if (!token) {
    if (process.env.NODE_ENV !== 'production' || !process.env.CF_ACCESS_DOMAIN) {
      // Local dev bypass - mock cfAccess payload using request body email
      const mockEmail = req.body?.email || 'local-developer@agape.nyc';
      (req as any).cfAccess = { sub: mockEmail, email: mockEmail };
      return next();
    }
    return res.status(401).json({ error: 'Missing Cloudflare Access token' });
  }
  const bearer = typeof token === 'string' && token.startsWith('Bearer ') ? token.slice(7) : token as string;
  try {
    const keys = await getJwks();
    const decodedHeader = jwt.decode(bearer, { complete: true }) as any;
    const pubPem = getKey(decodedHeader.header.kid, keys);
    if (!pubPem) throw new Error('Unable to find matching JWK');
    const payload = jwt.verify(bearer, pubPem, { algorithms: ['RS256'] }) as any;
    // Attach payload for downstream handlers
    (req as any).cfAccess = payload;
    next();
  } catch (err) {
    console.error('Cloudflare Access verification error:', err);
    return res.status(401).json({ error: 'Invalid Cloudflare Access token' });
  }
}
