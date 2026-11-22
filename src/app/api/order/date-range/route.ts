import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start');
    const endDate   = searchParams.get('end');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Both start and end dates are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format. Use ISO format (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { items: true, customer: true, statusHistory: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { success: true, count: orders.length, orders },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to search orders' },
      { status: 500 }
    );
  }
}
