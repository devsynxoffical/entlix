import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const ads = await prisma.advertisement.findMany({
      where: { groupId },
      orderBy: { firstDetectedAt: 'desc' }
    });

    return NextResponse.json(ads);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}
