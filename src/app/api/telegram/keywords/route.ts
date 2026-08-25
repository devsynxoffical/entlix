import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const keywords = await prisma.telegramKeyword.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { groups: true } },
      },
    });
    return NextResponse.json(keywords);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch Telegram keywords' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const keyword = String(body.keyword || '').trim();
    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    let userId: string | undefined;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = user?.id;
    }

    const created = await prisma.telegramKeyword.create({
      data: {
        keyword,
        status: 'ACTIVE',
        ...(userId ? { userId } : {}),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create Telegram keyword' }, { status: 500 });
  }
}
