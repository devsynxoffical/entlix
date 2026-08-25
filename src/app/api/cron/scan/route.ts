import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { detectNewAds, purgeDuplicateAds, purgeExpiredAds } from '@/lib/monitoring';
import { purgeExpiredTelegramGroups, scanAllTelegramKeywords } from '@/lib/telegramMonitoring';
import { sendBulkScanAlert, sendBulkTelegramAlert } from '@/lib/email';

// GET or POST /api/cron/scan – automated hourly scan (Meta ads + Telegram groups)
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
    const purged = await purgeDuplicateAds();
    const expiredPurged = await purgeExpiredAds();
    const expiredTelegram = await purgeExpiredTelegramGroups();

    const activeGroups = await prisma.monitoringGroup.findMany({
      where: { status: 'ACTIVE' },
    });

    const allNewAds: any[] = [];
    for (const group of activeGroups) {
      const created = await detectNewAds(group.id);
      allNewAds.push(...created);
    }

    const telegramScan = await scanAllTelegramKeywords();

    const user = await prisma.user.findFirst();
    let emailResult: any = null;
    let telegramEmailResult: any = null;

    if (allNewAds.length > 0) {
      emailResult = await sendBulkScanAlert({
        groupsScanned: activeGroups.length,
        ads: allNewAds,
        user,
      });
    }

    if (telegramScan.newGroups.length > 0) {
      telegramEmailResult = await sendBulkTelegramAlert({
        keywordsScanned: telegramScan.keywordsScanned,
        groups: telegramScan.newGroups,
        user,
      });
    }

    console.log(
      `⏰ [HOURLY CRON] Meta: ${activeGroups.length} group(s), ${allNewAds.length} new ad(s). ` +
        `Telegram: ${telegramScan.keywordsScanned} keyword(s), ${telegramScan.newGroups.length} new group(s). ` +
        `Purged ads ${purged}/${expiredPurged}, tg expired ${expiredTelegram}.`
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      scannedGroups: activeGroups.length,
      newAdsDetected: allNewAds.length,
      telegramKeywordsScanned: telegramScan.keywordsScanned,
      newTelegramGroups: telegramScan.newGroups.length,
      duplicatesRemoved: purged,
      expiredRemoved: expiredPurged,
      expiredTelegramRemoved: expiredTelegram,
      emailSent: !!emailResult?.sent,
      telegramEmailSent: !!telegramEmailResult?.sent,
      message:
        allNewAds.length > 0 || telegramScan.newGroups.length > 0
          ? `Hourly scan: ${allNewAds.length} new ad(s), ${telegramScan.newGroups.length} new Telegram group(s).`
          : 'Hourly scan completed. No new ads or Telegram groups.',
    });
  } catch (error) {
    console.error('Hourly cron scan error:', error);
    return NextResponse.json({ error: 'Cron scan failed' }, { status: 500 });
  }
}
