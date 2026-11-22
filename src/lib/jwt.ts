import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JWTPayload {
  sub: string;      // user identifier (email or id)
  role: string;     // e.g. 'admin'
  iat?: number;
  exp?: number;
}

/** Sign a JWT token (default expiry: 8h) */
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

/** Verify a JWT token – returns payload or null */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/** Extract token from Authorization header or cookie */
export function extractToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization') ?? '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  const cookieToken = req.cookies.get('token')?.value;
  if (cookieToken) return cookieToken;
  return null;
}

/** Middleware helper: returns payload if valid, or a 401 NextResponse */
export function requireAuth(
  req: NextRequest
): JWTPayload | NextResponse {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Missing authorization token' },
      { status: 401 }
    );
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, message: 'Invalid or expired token' },
      { status: 401 }
    );
  }
  return payload;
}
