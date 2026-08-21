import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { detectNewAds } from '@/lib/monitoring';
import { sendBulkScanAlert } from '@/lib/email';

// POST /api/groups/[id]/scan – trigger a manual ad scan for a group
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const created = await detectNewAds(id);

    const group = await prisma.monitoringGroup.findUnique({ where: { id } });
    const user = group?.userId
      ? await prisma.user.findUnique({ where: { id: group.userId } })
      : await prisma.user.findFirst();

    let emailSent = false;
    if (created.length > 0) {
      const result = await sendBulkScanAlert({
        groupsScanned: 1,
        ads: created,
        user,
      });
      emailSent = !!result?.sent;
    }

    return NextResponse.json({
      detected: created.length > 0,
      newAdsDetected: created.length,
      emailSent,
      ads: created,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}
