// Deprecated – use /api/products/[id] with the numeric Prisma id instead.
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ specid: string }> }
) {
  await params;
  return NextResponse.json(
    { success: false, message: 'This endpoint is deprecated. Use /api/products/[id] instead.' },
    { status: 410 }
  );
}
