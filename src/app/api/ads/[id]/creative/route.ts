import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { isDisplayableImageUrl, isLikelyAdCreativeMediaUrl } from '@/lib/adCreative';

/** Cache a client-extracted creative image URL for an ad. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === 'string' ? body.url.trim() : '';

  if (!url || !isLikelyAdCreativeMediaUrl(url) || !isDisplayableImageUrl(url)) {
    return NextResponse.json({ error: 'Invalid creative URL' }, { status: 400 });
  }

  const ad = await prisma.advertisement.findUnique({ where: { id } });
  if (!ad) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
  }

  const updated = await prisma.advertisement.update({
    where: { id },
    data: { adCreativeUrl: url },
  });

  return NextResponse.json({ ok: true, adCreativeUrl: updated.adCreativeUrl });
}
