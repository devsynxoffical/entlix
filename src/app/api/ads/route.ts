import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isNonImageCreativeUrl, resolveAdCreativeUrl } from '@/lib/adCreative';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const ads = await prisma.advertisement.findMany({
      where: { groupId },
      orderBy: { firstDetectedAt: 'desc' }
    });

    // Repair rows that accidentally stored Meta HTML snapshot URLs as creatives
    const repaired = await Promise.all(
      ads.map(async (ad) => {
        if (!isNonImageCreativeUrl(ad.adCreativeUrl)) {
          return ad;
        }

        const fixedUrl = resolveAdCreativeUrl(null, ad.matchingKeyword);
        const sourceLink =
          ad.sourceLink ||
          (ad.adCreativeUrl?.includes('facebook.com') ? ad.adCreativeUrl : null) ||
          (ad.metaAdId ? `https://www.facebook.com/ads/library/?id=${ad.metaAdId}` : null);

        try {
          return await prisma.advertisement.update({
            where: { id: ad.id },
            data: {
              adCreativeUrl: fixedUrl,
              ...(sourceLink && !ad.sourceLink ? { sourceLink } : {}),
            },
          });
        } catch {
          return { ...ad, adCreativeUrl: fixedUrl, sourceLink: sourceLink || ad.sourceLink };
        }
      })
    );

    return NextResponse.json(repaired);
  } catch (error) {
    console.error('Failed to fetch ads:', error);
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}
