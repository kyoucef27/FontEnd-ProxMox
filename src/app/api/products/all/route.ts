import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** GET /api/products/all — public-facing endpoint, authenticated via x-api-key */
export async function GET(req: NextRequest) {
  // Keep the existing API-key + origin check for external callers
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.MY_SECRET_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const origin = req.headers.get('origin');
  if (origin !== 'http://localhost:8888') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const products = await prisma.product.findMany();
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
