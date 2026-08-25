import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = await prisma.telegramGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.telegramGroup.update({
      where: { id },
      data: { isFavorite: !group.isFavorite },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
