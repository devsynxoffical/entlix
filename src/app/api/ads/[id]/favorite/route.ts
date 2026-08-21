import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/ads/[id]/favorite – toggle isFavorite status
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ad = await prisma.advertisement.findUnique({ where: { id } });
    if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });

    const updatedAd = await prisma.advertisement.update({
      where: { id },
      data: { isFavorite: !ad.isFavorite }
    });

    return NextResponse.json({ success: true, isFavorite: updatedAd.isFavorite });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 });
  }
}
