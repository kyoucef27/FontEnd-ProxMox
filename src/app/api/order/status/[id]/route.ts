import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/jwt';

export async function PUT(
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

    const { status, note } = await request.json();

    if (!status || !['pending', 'delivered', 'returned'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status value' }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const dateUpdates: any = {};
    if (status === 'delivered') dateUpdates.deliveryDate = new Date();
    if (status === 'returned')  dateUpdates.returnDate   = new Date();

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...dateUpdates,
        statusHistory: {
          create: [{ status, note: note || `Order marked as ${status}` }],
        },
      },
      include: { items: true, customer: true, statusHistory: true },
    });

    return NextResponse.json(
      { success: true, message: `Order status updated to ${status}`, order: updatedOrder },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
