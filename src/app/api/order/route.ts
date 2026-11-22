import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  // Auth check
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status   = searchParams.get('status') as 'pending' | 'delivered' | 'returned' | null;
    const startDate = searchParams.get('startDate');
    const endDate   = searchParams.get('endDate');
    const customer  = searchParams.get('customer');

    const where: any = {};

    if (status && ['pending', 'delivered', 'returned'].includes(status)) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate)   where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (customer) {
      where.customer = {
        OR: [
          { name:  { contains: customer, mode: 'insensitive' } },
          { email: { contains: customer, mode: 'insensitive' } },
        ],
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true, customer: true, statusHistory: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, count: orders.length, orders }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Auth check
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { items, total, customer } = body.order;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order must contain at least one item' },
        { status: 400 }
      );
    }
    if (typeof total !== 'number' || total < 0) {
      return NextResponse.json(
        { success: false, message: 'Total must be a non-negative number' },
        { status: 400 }
      );
    }
    if (!customer || typeof customer !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Customer information is required' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json(
          { success: false, message: 'Each item must have a valid productId' },
          { status: 400 }
        );
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json(
          { success: false, message: 'Each item must have a quantity of at least 1' },
          { status: 400 }
        );
      }
    }

    const order = await prisma.order.create({
      data: {
        total,
        status: 'pending',
        customer: {
          create: {
            name:    customer.name,
            email:   customer.email,
            address: customer.address,
            city:    customer.city,
            phone:   customer.phone,
          },
        },
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            quantity:  i.quantity,
          })),
        },
        statusHistory: {
          create: [{ status: 'pending', note: 'Order created' }],
        },
      },
      include: { items: true, customer: true, statusHistory: true },
    });

    return NextResponse.json(
      { success: true, message: 'Order created successfully', order },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
