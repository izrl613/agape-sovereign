import { cookies } from 'next/headers';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'agape-sovereign-secret-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface AuthSession {
  userId: string;
  email: string;
  username?: string;
}

/**
 * Verifies JWT token from cookies or authorization header
 */
export async function auth(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jose.jwtVerify(token, secretKey);

    if (!payload || !payload.userId || !payload.email) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      username: (payload.username as string) || undefined,
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

/**
 * Creates a signed JWT token for session management
 */
export async function createSessionToken(payload: { userId: string; email: string; username?: string }): Promise<string> {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}