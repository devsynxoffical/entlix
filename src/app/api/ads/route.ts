import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  isNonImageCreativeUrl,
  isPrivateMetaSnapshotUrl,
  isRealMetaAdId,
  resolveAdCreativeUrl,
  resolveSourceLink,
} from '@/lib/adCreative';
import { purgeDuplicateAds, purgeDemoAds } from '@/lib/monitoring';

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

    const ads = await prisma.advertisement.findMany({
      where: { groupId },
      orderBy: { firstDetectedAt: 'desc' }
    });

    // Safety: never return demo rows even if purge missed something
    const liveOnly = ads.filter((ad) => isRealMetaAdId(ad.metaAdId));

    const repaired = await Promise.all(
      liveOnly.map(async (ad) => {
        const needsCreativeFix = isNonImageCreativeUrl(ad.adCreativeUrl);
        const safeSource = resolveSourceLink(ad.sourceLink, ad.metaAdId);
        const needsSourceFix =
          !!safeSource &&
          (isPrivateMetaSnapshotUrl(ad.sourceLink) || ad.sourceLink !== safeSource);

        if (!needsCreativeFix && !needsSourceFix) {
          return { ...ad, sourceLink: safeSource || ad.sourceLink };
        }

        const data: { adCreativeUrl?: string; sourceLink?: string } = {};
        if (needsCreativeFix) {
          data.adCreativeUrl = resolveAdCreativeUrl(null, ad.matchingKeyword);
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
      adCreativeUrl: resolveAdCreativeUrl(ad.adCreativeUrl, ad.matchingKeyword),
      sourceLink: resolveSourceLink(ad.sourceLink, ad.metaAdId),
    }));

    return NextResponse.json(safeAds);
  } catch (error) {
    console.error('Failed to fetch ads:', error);
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}
