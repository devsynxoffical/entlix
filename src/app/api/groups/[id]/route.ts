import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/groups/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const group = await prisma.monitoringGroup.findUnique({
      where: { id },
      include: { _count: { select: { advertisements: true } } }
    });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

// PATCH /api/groups/[id] – update name, keywords, region, or status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, keywords, region, status } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (keywords !== undefined) dataToUpdate.keywords = keywords;
    if (region !== undefined) dataToUpdate.region = region;
    if (status !== undefined) {
      if (!['ACTIVE', 'PAUSED'].includes(status)) {
        return NextResponse.json({ error: 'status must be ACTIVE or PAUSED' }, { status: 400 });
      }
      dataToUpdate.status = status;
    }

    const group = await prisma.monitoringGroup.update({
      where: { id },
      data: dataToUpdate
    });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

// DELETE /api/groups/[id] – delete a group and all its ads
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.monitoringGroup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
