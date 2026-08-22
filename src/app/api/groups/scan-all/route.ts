import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { detectNewAds, purgeDuplicateAds, purgeExpiredAds } from '@/lib/monitoring';
import { sendBulkScanAlert } from '@/lib/email';

// POST /api/groups/scan-all – trigger scan for all ACTIVE groups
export async function POST() {
  try {
    const purged = await purgeDuplicateAds();
    const expiredPurged = await purgeExpiredAds();

    const activeGroups = await prisma.monitoringGroup.findMany({
      where: { status: 'ACTIVE' },
    });

    if (activeGroups.length === 0) {
      return NextResponse.json({ scanned: 0, newAdsDetected: 0, duplicatesRemoved: purged });
    }

    const allNewAds: any[] = [];
    for (const group of activeGroups) {
      const created = await detectNewAds(group.id);
      allNewAds.push(...created);
    }

    const user = await prisma.user.findFirst();
    let emailSent = false;
    if (allNewAds.length > 0) {
      const result = await sendBulkScanAlert({
        groupsScanned: activeGroups.length,
        ads: allNewAds,
        user,
      });
      emailSent = !!result?.sent;
    }

    return NextResponse.json({
      scanned: activeGroups.length,
      newAdsDetected: allNewAds.length,
      duplicatesRemoved: purged,
      emailSent,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Batch scan failed' }, { status: 500 });
  }
}
