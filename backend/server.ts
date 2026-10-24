import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { passkeyHandler } from './auth/passkey-handler';
import { architectAI } from './core/architect-ai';
import { getAgentForModule } from '../agents/agent-registry';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - User: ${req.body.userId || 'Unknown'}`);
  next();
});

// --- AUTH ENDPOINTS ---
app.post('/api/auth/generate-registration-options', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) throw new Error('userId is required');
    const options = await passkeyHandler.handleRegistrationOptions(userId);
    res.json(options);
  } catch (e: any) {
    next(e);
  }
});

app.post('/api/auth/verify-registration', async (req, res, next) => {
  try {
    const { userId, body } = req.body;
    if (!userId || !body) throw new Error('userId and body are required');
    const result = await passkeyHandler.handleVerifyRegistration(userId, body);
    res.json(result);
  } catch (e: any) {
    next(e);
  }
});

app.post('/api/auth/generate-authentication-options', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) throw new Error('userId is required');
    const options = await passkeyHandler.handleAuthenticationOptions(userId);
    res.json(options);
  } catch (e: any) {
    next(e);
  }
});

app.post('/api/auth/verify-authentication', async (req, res, next) => {
  try {
    const { userId, body } = req.body;
    if (!userId || !body) throw new Error('userId and body are required');
    const result = await passkeyHandler.handleVerifyAuthentication(userId, body);
    res.json(result);
  } catch (e: any) {
    next(e);
  }
});

// --- IDENTITY VECTOR ENDPOINTS ---
app.post('/api/vector/collect', async (req, res, next) => {
  try {
    const { userId, moduleId, data } = req.body;
    if (!userId || !moduleId || !Array.isArray(data)) {
      throw new Error('Invalid request: userId, moduleId, and data (array) are required');
    }
    const agent = getAgentForModule(moduleId);
    const result = await agent.processUserVector(userId, data);
    res.json(result);
  } catch (e: any) {
    next(e);
  }
});

// --- ARCHITECT AI ENDPOINTS ---
app.post('/api/architect/synthesize', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) throw new Error('userId is required');
    const synthesis = await architectAI.synthesizeIdentity(userId);
    res.json(synthesis);
  } catch (e: any) {
    next(e);
  }
});

app.post('/api/architect/finalize', async (req, res, next) => {
  try {
    const { userId, authPayload } = req.body;
    if (!userId || !authPayload) throw new Error('userId and authPayload are required');
    const report = await architectAI.finalizeReport(userId, authPayload);
    res.json(report);
  } catch (e: any) {
    next(e);
  }
});

// --- GLOBAL ERROR HANDLER ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[SERVER ERROR] ${err.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Sovereign Backend Server running on port ${PORT}`);
  console.log(`🛡️ Security: Helmet enabled | CORS enabled | Zero-Knowledge Pipeline active`);
});
