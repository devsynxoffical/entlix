import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { detectNewAds } from '@/lib/monitoring';

// GET or POST /api/cron/scan – automated 1-hour recurring scan endpoint
export async function GET() {
  return handleCronScan();
}

export async function POST() {
  return handleCronScan();
}

async function handleCronScan() {
  try {
    const activeGroups = await prisma.monitoringGroup.findMany({
      where: { status: 'ACTIVE' }
    });

    if (activeGroups.length === 0) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        scannedGroups: 0,
        newAdsDetected: 0,
        message: 'No active monitoring groups found'
      });
    }

    let newAdsCount = 0;
    for (const group of activeGroups) {
      const newAd = await detectNewAds(group.id);
      if (newAd) newAdsCount++;
    }

    console.log(`⏰ [1-HOUR CRON COMPLETED] Scanned ${activeGroups.length} active groups. ${newAdsCount} new ad(s) detected and emailed to admin.`);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      scannedGroups: activeGroups.length,
      newAdsDetected: newAdsCount,
      message: `Hourly scan completed. ${newAdsCount} new ad(s) detected and alerts sent.`
    });
  } catch (error) {
    console.error('Hourly cron scan error:', error);
    return NextResponse.json({ error: 'Cron scan failed' }, { status: 500 });
  }
}
