import { NextResponse } from 'next/server';
import { detectNewAds } from '@/lib/monitoring';

// POST /api/groups/[id]/scan – trigger a manual ad scan for a group
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const newAd = await detectNewAds(id);
    return NextResponse.json({ detected: !!newAd, ad: newAd });
  } catch (error) {
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}
