import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/jwt';
import { unlink } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    
    // Sanitize updatable fields
    const data: any = {};
    if (typeof body.name === 'string') data.name = body.name;
    if (typeof body.price === 'number') data.price = body.price;
    if (typeof body.desc === 'string') data.desc = body.desc;
    if (typeof body.fullDesc === 'string') data.fullDesc = body.fullDesc;
    if (typeof body.category === 'string') data.category = body.category;
    if (typeof body.productType === 'string') data.productType = body.productType;
    if (typeof body.platform === 'string') data.platform = body.platform;
    if (typeof body.subscriptionDuration === 'string') data.subscriptionDuration = body.subscriptionDuration;
    if (typeof body.deliveryMethod === 'string') data.deliveryMethod = body.deliveryMethod;
    if (typeof body.inStock === 'boolean') data.inStock = body.inStock;

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    // Delete local image files
    await Promise.allSettled(
      (product.pictures ?? []).map(async (url: string) => {
        const filePath = path.join(process.cwd(), 'public', url);
        await unlink(filePath);
      })
    );

    await prisma.product.delete({ where: { id } });

    return NextResponse.json(
      { success: true, message: 'Product and associated images deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
