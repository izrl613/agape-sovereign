import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'agape-sovereign-secret');

const protectedRoutes = ['/dashboard', '/breaches', '/settings'];
const publicRoutes = ['/login', '/register'];

async function verifyToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    const decoded = await jwt.verify(token, secret);
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { userId } = await verifyToken(request);
  const { pathname } = request.nextUrl;

  // Check if route should be protected
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!userId) {
      const loginUrl = NextResponse.redirect(new URL('/login', request.url));
      loginUrl.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      return loginUrl;
    }
  }

  // Check if route should be public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    if (userId) {
      const dashboardUrl = NextResponse.redirect(new URL('/dashboard', request.url));
      return dashboardUrl;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
