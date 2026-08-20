import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/stats – aggregated real-time KPI numbers & trend analytics
export async function GET() {
  try {
    const [totalAds, totalGroups, activeGroups] = await Promise.all([
      prisma.advertisement.count(),
      prisma.monitoringGroup.count(),
      prisma.monitoringGroup.count({ where: { status: 'ACTIVE' } })
    ]);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const newAdsToday = await prisma.advertisement.count({
      where: {
        classification: 'NEW',
        firstDetectedAt: { gte: startOfToday }
      }
    });

    const regions = await prisma.monitoringGroup.findMany({
      select: { region: true },
      distinct: ['region']
    });

    // Monthly trend calculation for last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyTrends = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [newCount, existingCount] = await Promise.all([
        prisma.advertisement.count({
          where: {
            classification: 'NEW',
            firstDetectedAt: { gte: d, lt: nextD }
          }
        }),
        prisma.advertisement.count({
          where: {
            classification: 'EXISTING',
            firstDetectedAt: { gte: d, lt: nextD }
          }
        })
      ]);

      monthlyTrends.push({
        month: monthNames[d.getMonth()],
        newCount,
        existingCount,
        total: newCount + existingCount
      });
    }

    return NextResponse.json({
      totalAds,
      totalGroups,
      activeGroups,
      newAdsToday,
      totalRegions: regions.length,
      monthlyTrends
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
