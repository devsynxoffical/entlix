import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { detectNewAds } from '@/lib/monitoring';

// POST /api/groups/scan-all – trigger scan for all ACTIVE groups
export async function POST() {
  try {
    const activeGroups = await prisma.monitoringGroup.findMany({
      where: { status: 'ACTIVE' }
    });

    if (activeGroups.length === 0) {
      return NextResponse.json({ scanned: 0, newAdsDetected: 0 });
    }

    let newAdsCount = 0;
    for (const group of activeGroups) {
      const newAd = await detectNewAds(group.id);
      if (newAd) newAdsCount++;
    }

    return NextResponse.json({
      scanned: activeGroups.length,
      newAdsDetected: newAdsCount
    });
  } catch (error) {
    return NextResponse.json({ error: 'Batch scan failed' }, { status: 500 });
  }
}
