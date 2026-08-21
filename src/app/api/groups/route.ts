import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { runInitialBaseline } from '@/lib/monitoring';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { name, keywords, region } = await req.json();
    if (!name || !keywords || !region) {
      return NextResponse.json({ error: 'name, keywords, region are required' }, { status: 400 });
    }

    let userId: string | undefined;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = user?.id;
    }

    const group = await prisma.monitoringGroup.create({
      data: {
        name,
        keywords,
        region,
        ...(userId ? { userId } : {}),
      },
    });
    await runInitialBaseline(group.id);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const groups = await prisma.monitoringGroup.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { advertisements: true } },
      },
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}
