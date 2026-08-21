import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/advertisers/[name] – Aggregate full brand portfolio & stats for an advertiser
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    const ads = await prisma.advertisement.findMany({
      where: {
        advertiserName: {
          equals: decodedName
        }
      },
      orderBy: { firstDetectedAt: 'desc' }
    });

    const keywordsUsed = Array.from(new Set(ads.map(a => a.matchingKeyword)));
    const regionsTargeted = Array.from(new Set(ads.map(a => a.region)));
    const newAdsCount = ads.filter(a => a.classification === 'NEW').length;
    const whatsappCount = ads.filter(a => !!a.whatsappContact).length;

    return NextResponse.json({
      advertiserName: decodedName,
      totalAdsTracked: ads.length,
      newAdsCount,
      whatsappCount,
      keywordsUsed,
      regionsTargeted,
      ads
    });
  } catch (error) {
    console.error('Advertiser Portfolio Error:', error);
    return NextResponse.json({ error: 'Failed to fetch advertiser portfolio' }, { status: 500 });
  }
}
