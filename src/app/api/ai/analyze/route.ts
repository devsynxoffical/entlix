import { NextResponse } from 'next/server';

// POST /api/ai/analyze – AI Competitor Ad Breakdown & Counter-Ad Generator
export async function POST(req: Request) {
  try {
    const { adText, advertiserName, matchingKeyword, region } = await req.json();

    const cleanText = adText || '';
    const kw = matchingKeyword || 'growth';

    // Structured AI Hook & Angle Detection Heuristics
    let hookAngle = 'Curiosity & Value Proposition';
    if (cleanText.match(/stop|wasting|struggling|tired|fail/i)) {
      hookAngle = 'Problem-Agitate-Solve (PAS)';
    } else if (cleanText.match(/offer|discount|30%|50%|save|free|limited/i)) {
      hookAngle = 'Urgency & Direct Offer Call-To-Action';
    } else if (cleanText.match(/how|framework|playbook|secret|proven/i)) {
      hookAngle = 'Educational Authority & Lead Magnet';
    }

    let offerType = 'Direct Sales Call-To-Action';
    if (cleanText.match(/free|trial|demo|audit|playbook/i)) {
      offerType = 'Front-End Lead Magnet / Free Demo';
    } else if (cleanText.match(/off|discount|sale|price/i)) {
      offerType = 'Limited Time Promotional Discount';
    } else if (cleanText.match(/whatsapp|chat|talk|call/i)) {
      offerType = 'Direct WhatsApp Consult';
    }

    const targetPainPoints = [
      `Inconsistent lead generation in ${region || 'target market'}`,
      `Wasted ad spend on low-converting competitor offers`,
      `Manual follow-up process causing qualified leads to drop off`
    ];

    const counterAds = [
      {
        angleName: 'Disruptor Angle (Outperform on Value & ROI)',
        headline: `Outperforming ${advertiserName || 'Traditional Competitors'} in ${region || 'your market'}`,
        primaryText: `Frustrated with standard ${kw} solutions that overpromise and underdeliver? Our verified framework cuts cost-per-lead by 50% while scaling qualified bookings on autopilot.\n\n✅ Zero long-term contracts\n✅ Guaranteed 3x ROI roadmap\n✅ Instant setup in 48 hours`,
        callToAction: 'Claim Your Strategy Audit'
      },
      {
        angleName: 'Direct Contrast Angle (Guaranteed Results)',
        headline: `Why Top ${kw.toUpperCase()} Brands Are Switching From ${advertiserName || 'Competitors'}`,
        primaryText: `While other agencies only run ads, we build a complete end-to-end acquisition ecosystem from first click to closed deal.\n\nStop settling for partial results. Get the full breakdown today.`,
        callToAction: 'Get Counter Strategy'
      }
    ];

    return NextResponse.json({
      success: true,
      analysis: {
        hookAngle,
        offerType,
        targetPainPoints,
        counterAds
      }
    });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}
