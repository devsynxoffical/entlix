import { NextResponse } from 'next/server';

// GET /api/ai/keywords?niche=... – AI Keyword Suggestion Generator
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const niche = (searchParams.get('niche') || 'saas').toLowerCase();

    const KEYWORD_DICTIONARY: Record<string, string[]> = {
      dental: ['dental implants', 'all on 4 implants', 'full arch implants', 'invisalign dentist', 'cosmetic dentistry', 'teeth whitening promo', 'implant dentist'],
      saas: ['saas software', 'ai lead generation', 'crm platform', 'client acquisition system', 'marketing automation', 'b2b sales funnel', 'workflow automation'],
      roofing: ['roof repair quote', 'roof replacement estimate', 'commercial roofing contractor', 'storm damage roof repair', 'roofing lead generation', 'residential roofing'],
      realestate: ['luxury homes for sale', 'commercial property listings', 'first time home buyer promo', 'real estate investment', 'home valuation estimate', 'mortgage broker'],
      ecom: ['shopify store scale', 'ecommerce marketing agency', 'facebook ads ecommerce', 'dtc brand growth', 'black friday promo', 'high converting funnel']
    };

    let matchedKeywords = KEYWORD_DICTIONARY.saas;
    for (const key of Object.keys(KEYWORD_DICTIONARY)) {
      if (niche.includes(key)) {
        matchedKeywords = KEYWORD_DICTIONARY[key];
        break;
      }
    }

    return NextResponse.json({
      niche,
      keywords: matchedKeywords,
      formattedString: matchedKeywords.join('; ')
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate AI keywords' }, { status: 500 });
  }
}
