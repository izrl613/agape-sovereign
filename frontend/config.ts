/**
 * Sovereign System Configuration
 * All API endpoints and keys are managed here.
 * In production, these should be loaded from process.env.
 */
export const CONFIG = {
  API_ENDPOINTS: {
    VERIFICATION: 'https://api.sovereign.nyc/v1/verify',
    ARCHITECT: 'https://api.sovereign.nyc/v1/architect',
    LLM_LOCAL: 'http://localhost:11434/api/generate',
  },
  API_KEYS: {
    SENDGRID: process.env.SENDGRID_API_KEY || '',
    PLAID: process.env.PLAID_CLIENT_ID || '',
    ONFIDO: process.env.ONFIDO_API_KEY || '',
    ALCHEMY: process.env.ALCHEMY_API_KEY || '',
    // Add other provider keys here
  },
  SECURITY: {
    ENCRYPTION_ALGORITHM: 'aes-256-cbc',
    SALT: 'sovereign-zk-salt-2026',
    MIN_VECTORS: 16,
  }
};
