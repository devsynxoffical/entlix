import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { runInitialBaseline } from '@/lib/monitoring';

export async function POST(req: Request) {
  try {
    const { name, keywords, region } = await req.json();
    if (!name || !keywords || !region) {
      return NextResponse.json({ error: 'name, keywords, region are required' }, { status: 400 });
    }
    const group = await prisma.monitoringGroup.create({
      data: { name, keywords, region }
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
        _count: { select: { advertisements: true } }
      }
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}
