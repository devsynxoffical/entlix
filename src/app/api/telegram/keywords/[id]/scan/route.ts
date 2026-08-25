import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { detectNewTelegramGroups } from '@/lib/telegramMonitoring';
import { sendBulkTelegramAlert } from '@/lib/email';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const keyword = await prisma.telegramKeyword.findUnique({ where: { id } });
    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    const created = await detectNewTelegramGroups(id);

    const user = keyword.userId
      ? await prisma.user.findUnique({ where: { id: keyword.userId } })
      : await prisma.user.findFirst();

    let emailSent = false;
    if (created.length > 0) {
      const result = await sendBulkTelegramAlert({
        keywordsScanned: 1,
        groups: created,
        user,
      });
      emailSent = !!result?.sent;
    }

    return NextResponse.json({
      detected: created.length > 0,
      newGroupsDetected: created.length,
      emailSent,
      groups: created,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Telegram scan failed' }, { status: 500 });
  }
}
