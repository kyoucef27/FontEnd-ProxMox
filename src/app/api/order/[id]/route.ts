import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: 'Invalid order ID' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, customer: true, statusHistory: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
