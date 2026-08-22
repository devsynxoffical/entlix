import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  isNonImageCreativeUrl,
  isPlaceholderCreativeUrl,
  isPrivateMetaSnapshotUrl,
  isRealMetaAdId,
  isDisplayableImageUrl,
  resolveSourceLink,
} from '@/lib/adCreative';
import { purgeDuplicateAds, purgeDemoAds, purgeExpiredAds } from '@/lib/monitoring';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    // Remove duplicates + delete all demo/simulated ads
    await purgeDuplicateAds(groupId);
    await purgeDemoAds(groupId);
    await purgeExpiredAds(groupId);

    const ads = await prisma.advertisement.findMany({
      where: { groupId },
      orderBy: { firstDetectedAt: 'desc' }
    });

    // Safety: never return demo rows even if purge missed something
    const liveOnly = ads.filter((ad) => isRealMetaAdId(ad.metaAdId));

    const repaired = await Promise.all(
      liveOnly.map(async (ad) => {
        const needsCreativeFix =
          isPlaceholderCreativeUrl(ad.adCreativeUrl) ||
          (isNonImageCreativeUrl(ad.adCreativeUrl) && !isDisplayableImageUrl(ad.adCreativeUrl));
        const safeSource = resolveSourceLink(ad.sourceLink, ad.metaAdId);
        const needsSourceFix =
          !!safeSource &&
          (isPrivateMetaSnapshotUrl(ad.sourceLink) || ad.sourceLink !== safeSource);

        if (!needsCreativeFix && !needsSourceFix) {
          return { ...ad, sourceLink: safeSource || ad.sourceLink };
        }

        const data: { adCreativeUrl?: string | null; sourceLink?: string } = {};
        if (needsCreativeFix) {
          data.adCreativeUrl = null;
        }
        if (needsSourceFix && safeSource) {
          data.sourceLink = safeSource;
        }

        try {
          return await prisma.advertisement.update({
            where: { id: ad.id },
            data,
          });
        } catch {
          return {
            ...ad,
            ...(data.adCreativeUrl ? { adCreativeUrl: data.adCreativeUrl } : {}),
            sourceLink: safeSource || ad.sourceLink,
          };
        }
      })
    );

    const safeAds = repaired.map((ad) => ({
      ...ad,
      sourceLink: resolveSourceLink(ad.sourceLink, ad.metaAdId),
    }));

    return NextResponse.json(safeAds);
  } catch (error) {
    console.error('Failed to fetch ads:', error);
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}
