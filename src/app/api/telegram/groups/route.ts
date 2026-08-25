import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { purgeExpiredTelegramGroups } from '@/lib/telegramMonitoring';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keywordId = searchParams.get('keywordId');

    if (keywordId) {
      await purgeExpiredTelegramGroups(keywordId);
    } else {
      await purgeExpiredTelegramGroups();
    }

    const groups = await prisma.telegramGroup.findMany({
      where: keywordId ? { keywordId } : undefined,
      orderBy: { firstDetectedAt: 'desc' },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch Telegram groups' }, { status: 500 });
  }
}
