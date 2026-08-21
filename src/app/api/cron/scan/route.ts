import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { detectNewAds, purgeDuplicateAds } from '@/lib/monitoring';
import { sendBulkScanAlert } from '@/lib/email';

// GET or POST /api/cron/scan – automated hourly scan
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';

  const auth = req.headers.get('authorization') || '';
  if (auth === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  if (url.searchParams.get('secret') === secret) return true;

  const vercelCron = req.headers.get('x-vercel-cron');
  if (vercelCron === '1' || vercelCron === 'true') return true;

  return false;
}

export async function GET(req: Request) {
  return handleCronScan(req);
}

export async function POST(req: Request) {
  return handleCronScan(req);
}

async function handleCronScan(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Global duplicate cleanup first
    const purged = await purgeDuplicateAds();

    const activeGroups = await prisma.monitoringGroup.findMany({
      where: { status: 'ACTIVE' },
    });

    if (activeGroups.length === 0) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        scannedGroups: 0,
        newAdsDetected: 0,
        duplicatesRemoved: purged,
        message: 'No active monitoring groups found',
      });
    }

    const allNewAds: any[] = [];
    for (const group of activeGroups) {
      const created = await detectNewAds(group.id);
      allNewAds.push(...created);
    }

    const user = await prisma.user.findFirst();
    let emailResult: any = null;
    if (allNewAds.length > 0) {
      emailResult = await sendBulkScanAlert({
        groupsScanned: activeGroups.length,
        ads: allNewAds,
        user,
      });
    }

    console.log(
      `⏰ [HOURLY CRON] Scanned ${activeGroups.length} group(s). ${allNewAds.length} new unique ad(s). Purged ${purged} duplicate(s).`
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      scannedGroups: activeGroups.length,
      newAdsDetected: allNewAds.length,
      duplicatesRemoved: purged,
      emailSent: !!emailResult?.sent,
      message:
        allNewAds.length > 0
          ? `Hourly scan found ${allNewAds.length} new unique ad(s); one summary email sent.`
          : 'Hourly scan completed. No new unique ads.',
    });
  } catch (error) {
    console.error('Hourly cron scan error:', error);
    return NextResponse.json({ error: 'Cron scan failed' }, { status: 500 });
  }
}
