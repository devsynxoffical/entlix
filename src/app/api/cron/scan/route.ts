import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { detectNewAds } from '@/lib/monitoring';

// GET or POST /api/cron/scan – automated hourly scan
// Protect with Authorization: Bearer <CRON_SECRET> (or ?secret=)
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // Allow unauthenticated only in local/dev when no secret is configured
  if (!secret) return process.env.NODE_ENV !== 'production';

  const auth = req.headers.get('authorization') || '';
  if (auth === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  if (url.searchParams.get('secret') === secret) return true;

  // Vercel Cron sends this header when CRON_SECRET is set as env
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
    const activeGroups = await prisma.monitoringGroup.findMany({
      where: { status: 'ACTIVE' },
    });

    if (activeGroups.length === 0) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        scannedGroups: 0,
        newAdsDetected: 0,
        emailsSent: 0,
        message: 'No active monitoring groups found',
      });
    }

    let newAdsCount = 0;
    for (const group of activeGroups) {
      const newAd = await detectNewAds(group.id);
      // detectNewAds emails each newly created ad when emailAlerts is enabled
      if (newAd) newAdsCount++;
    }

    console.log(
      `⏰ [HOURLY CRON] Scanned ${activeGroups.length} group(s). ${newAdsCount} new ad batch(es) detected.`
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      scannedGroups: activeGroups.length,
      newAdsDetected: newAdsCount,
      message: `Hourly scan completed. ${newAdsCount} new ad batch(es) detected; alerts emailed when configured.`,
    });
  } catch (error) {
    console.error('Hourly cron scan error:', error);
    return NextResponse.json({ error: 'Cron scan failed' }, { status: 500 });
  }
}
