import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: { keyword?: string; status?: string } = {};

    if (typeof body.keyword === 'string' && body.keyword.trim()) {
      data.keyword = body.keyword.trim();
    }
    if (body.status === 'ACTIVE' || body.status === 'PAUSED') {
      data.status = body.status;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await prisma.telegramKeyword.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update keyword' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.telegramKeyword.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete keyword' }, { status: 500 });
  }
}
