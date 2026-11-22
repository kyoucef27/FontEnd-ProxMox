import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const q = request.nextUrl.searchParams.get('q');
    if (!q) {
      return NextResponse.json({ success: false, message: 'Search query is required' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { desc: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, count: products.length, products }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
