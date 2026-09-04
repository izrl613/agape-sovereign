import { Router } from 'express';
import type { Request, Response } from 'express';
import { cloudflareAccessMiddleware } from '../middleware/cloudflareAccess.ts';
import {
  getRegistrationOptions,
  verifyAndStoreRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
} from '../services/passkeyService.ts';

const router = Router();

// All routes require Cloudflare Access – ensures user is already authorized via Zero Trust
router.use(cloudflareAccessMiddleware);

// Helper to extract UID from Cloudflare JWT payload (assumes `email` or `sub` claim)
function extractUid(req: Request): string {
  const payload = (req as any).cfAccess;
  if (!payload) throw new Error('Missing Cloudflare JWT payload');
  // Use the `sub` claim as a stable UID
  return payload.sub || payload.email || 'unknown';
}

// ---------- Registration ----------
router.post('/register/options', async (req: Request, res: Response) => {
  try {
    const uid = extractUid(req);
    const options = await getRegistrationOptions(uid);
    res.json(options);
  } catch (e) {
    console.error('Passkey registration options error', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const uid = extractUid(req);
    const attestation = req.body; // client should send the full credential object
    const result = await verifyAndStoreRegistration(uid, attestation);
    res.json(result);
  } catch (e) {
    console.error('Passkey registration verification error', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

// ---------- Authentication (login) ----------
router.post('/authenticate/options', async (req: Request, res: Response) => {
  try {
    const uid = extractUid(req);
    const options = await getAuthenticationOptions(uid);
    res.json(options);
  } catch (e) {
    console.error('Passkey auth options error', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/authenticate', async (req: Request, res: Response) => {
  try {
    const uid = extractUid(req);
    const assertion = req.body;
    const { customToken } = await verifyAuthentication(uid, assertion);
    res.json({ customToken });
  } catch (e) {
    console.error('Passkey authentication error', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
