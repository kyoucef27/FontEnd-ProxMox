import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { email: rawEmail } = await params;
    const email = decodeURIComponent(rawEmail);

    const orders = await prisma.order.findMany({
      where: { customer: { email } },
      include: { items: true, customer: true, statusHistory: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { success: true, count: orders.length, orders },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
