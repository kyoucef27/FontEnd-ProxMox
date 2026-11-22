import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/jwt';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/** Save a Next.js File to disk and return its public URL */
async function saveFile(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext      = path.extname(file.name) || '.jpg';
  const filename = `${randomUUID()}${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

/**
 * POST /api/products/upload
 * Accepts the same multipart form as POST /api/products.
 * Saves images locally and creates the product record.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();

    const name                 = formData.get('name')                 as string;
    const price                = Number(formData.get('price'));
    const desc                 = formData.get('desc')                 as string;
    const fullDesc             = formData.get('fullDesc')             as string;
    const category             = formData.get('category')             as string;
    const productType          = formData.get('productType')          as string;
    const platform             = formData.get('platform')             as string;
    const subscriptionDuration = (formData.get('subscriptionDuration') as string) || 'N/A';
    const deliveryMethod       = (formData.get('deliveryMethod')       as string) || 'email';
    const inStock              = formData.get('inStock') === 'on' || formData.get('inStock') === 'true';
    const files                = formData.getAll('pictures')          as File[];

    if (!name || !price || !desc || !fullDesc || !category || !productType || !platform) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    if (!['Streaming', 'Gaming', 'Software', 'Other'].includes(category)) {
      return NextResponse.json({ success: false, message: 'Invalid category' }, { status: 400 });
    }
    if (!['account', 'subscription', 'license', 'gift-card'].includes(productType)) {
      return NextResponse.json({ success: false, message: 'Invalid product type' }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ success: false, message: 'At least one image is required' }, { status: 400 });
    }

    const pictureUrls = await Promise.all(files.map(saveFile));

    const product = await prisma.product.create({
      data: {
        name, price, desc, fullDesc, category, productType, platform,
        subscriptionDuration, deliveryMethod, inStock,
        pictures: pictureUrls,
        views: 0, stars: 0, sold: 0,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Product created successfully', product },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[upload POST]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
