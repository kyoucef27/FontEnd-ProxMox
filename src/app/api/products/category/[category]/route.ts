import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { category } = await params;
    if (!['Streaming', 'Gaming', 'Software', 'Other'].includes(category)) {
      return NextResponse.json({ success: false, message: 'Invalid category' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, count: products.length, products }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
