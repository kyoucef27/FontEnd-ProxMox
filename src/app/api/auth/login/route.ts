import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Look up the user in the Customer table
    const user = await prisma.customer.findFirst({ where: { email } });
    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = signToken({ sub: email, role: 'admin' });
    const response = NextResponse.json({ success: true, token }, { status: 200 });

    // Set cookie for browser sessions and middleware
    response.cookies.set('token', token, {
      path: '/',
      maxAge: 8 * 60 * 60,
      sameSite: 'lax',
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
