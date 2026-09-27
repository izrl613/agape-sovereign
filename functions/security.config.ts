/**
 * Security Configuration for Cloud Functions
 * Centralized security constants and validation helpers
 */

// Rate limiting configuration
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later',
  },
  // Sensitive operations - very strict
  STRICT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 attempts per hour
    message: 'Rate limit exceeded, please try again later',
  },
  // General API endpoints
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many requests, please slow down',
  },
} as const;

// CORS configuration
export const CORS_CONFIG = {
  // Production allowed origins
  PRODUCTION_ORIGINS: [
    'https://sovereign.nyc',
    'https://www.sovereign.nyc',
    'https://agape-sovereign.web.app',
    'https://agape-sovereign.firebaseapp.com',
  ],
  // Development allowed origins (includes localhost variants)
  DEVELOPMENT_ORIGINS: [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:5002',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5002',
  ],
  // WebAuthn allowed origins for credential verification
  WEBAUTHN_ORIGINS: [
    'https://sovereign.nyc',
    'https://www.sovereign.nyc',
    'https://agape-sovereign.web.app',
    'https://agape-sovereign.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:5002',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5002',
  ],
} as const;

// Helmet security headers configuration
export const HELMET_CONFIG = {
  contentSecurityPolicy: false, // Disabled for WebAuthn compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
} as const;

// Cookie configuration
export const COOKIE_CONFIG = {
  // Session cookie
  SESSION: {
    httpOnly: true,
    secure: true, // Always true in production (Cloud Functions)
    signed: true,
    maxAge: 15 * 60 * 1000, // 15 minutes
    sameSite: 'strict' as const, // Strict in production for CSRF protection
    path: '/',
    priority: 'high' as const,
  },
  // Clear cookie
  CLEAR: {
    httpOnly: true,
    secure: true,
    signed: true,
    maxAge: 0,
    sameSite: 'strict' as const,
    path: '/',
  },
} as const;

// Input validation limits
export const VALIDATION_LIMITS = {
  EMAIL_MAX_LENGTH: 254,
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_MAX_LENGTH: 128,
  REQUEST_BODY_MAX_SIZE: '256kb',
  CREDENTIAL_ID_MAX_LENGTH: 1024,
  PUBLIC_KEY_MAX_LENGTH: 2048,
  USER_ID_MAX_LENGTH: 128,
  MODULE_ID_MAX_LENGTH: 64,
} as const;

// Security event types for audit logging
export const SECURITY_EVENTS = {
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure',
  PASSKEY_REGISTER: 'passkey_register',
  PASSKEY_LOGIN: 'passkey_login',
  PASSKEY_VERIFY_FAIL: 'passkey_verify_fail',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_INPUT: 'invalid_input',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
} as const;

// Firebase App Check configuration
export const APP_CHECK_CONFIG = {
  enabled: process.env.RECAPTCHA_ENABLED === 'true',
  provider: 'recaptcha-v3',
  tokenHeader: 'X-Firebase-AppCheck',
} as const;

// Function configuration defaults
export const FUNCTION_DEFAULTS = {
  region: 'us-central1',
  timeoutSeconds: 30,
  memory: '256MiB',
  minInstances: 0,
  maxInstances: 10,
  invoker: 'public' as const,
  serviceAccount: 'firebase-adminsdk-fbsvc@agape-sovereign.iam.gserviceaccount.com',
} as const;