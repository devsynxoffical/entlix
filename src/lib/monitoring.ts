import prisma from './db';
import { sendEmailAlert } from './email';

// High quality category image presets for dynamic fallback
const CATEGORY_IMAGES: Record<string, string[]> = {
  saas: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80'
  ],
  ecom: [
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'
  ],
  dental: [
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80'
  ],
  realestate: [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'
  ],
  default: [
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'
  ]
};

function getCreativeForKeyword(keyword: string): string {
  const k = keyword.toLowerCase();
  let pool = CATEGORY_IMAGES.default;
  if (k.includes('dent') || k.includes('teeth') || k.includes('clinic')) pool = CATEGORY_IMAGES.dental;
  else if (k.includes('saas') || k.includes('soft') || k.includes('app') || k.includes('lead') || k.includes('automation')) pool = CATEGORY_IMAGES.saas;
  else if (k.includes('estate') || k.includes('house') || k.includes('home') || k.includes('property')) pool = CATEGORY_IMAGES.realestate;
  else if (k.includes('shop') || k.includes('store') || k.includes('brand') || k.includes('sale')) pool = CATEGORY_IMAGES.ecom;

  return pool[Math.floor(Math.random() * pool.length)];
}

function generateAdvertiserName(keyword: string): string {
  const k = keyword.trim();
  const cap = k.charAt(0).toUpperCase() + k.slice(1);
  const prefixes = ['Apex', 'Scale', 'NextGen', 'Premier', 'Elite', 'Omni', 'Vanguard'];
  const suffixes = ['Global', 'Group', 'Media', 'Solutions', 'Co', 'Labs', 'Direct'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix} ${cap} ${suffix}`;
}

function generateAdText(keyword: string, region: string): string {
  const templates = [
    `Transforming how ${region} businesses handle ${keyword}. Unlock exclusive access to our proven framework today! WhatsApp us at +44 7700 900077 to get started.`,
    `Looking for top-rated ${keyword} solutions in ${region}? See why over 5,000+ customers switched to our platform this quarter. Chat with our sales team on WhatsApp: +1 (555) 019-2834.`,
    `Special limited-time offer for ${region}: Get 30% off your first 3 months of premium ${keyword} management. Click https://wa.me/447700900077 to claim now.`,
    `Stop wasting budget on inefficient ${keyword}. Our AI-driven technology delivers 3x ROI guaranteed. Reach us on WhatsApp.`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Extractor for WhatsApp links & phone numbers from ad copy & captions
function extractWhatsAppContact(text: string, captions: string[] = []): string | null {
  const combined = [text, ...captions].join(' ');
  
  // Check wa.me or api.whatsapp.com links
  const waLinkMatch = combined.match(/(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com\/send\?phone=)(\d+)/i);
  if (waLinkMatch && waLinkMatch[1]) {
    return waLinkMatch[1];
  }

  // Check international phone numbers (e.g. +44 7700 900077 or +1 (555) 019-2834)
  const phoneMatch = combined.match(/(?:\+|00)\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);
  if (phoneMatch) {
    const rawNumber = phoneMatch[0].replace(/[^0-9]/g, '');
    if (rawNumber.length >= 8 && rawNumber.length <= 15) {
      return rawNumber;
    }
  }

  return null;
}

export async function fetchMetaAdLibraryAPI(searchTerms: string, region: string, accessToken: string) {
  try {
    const fields = 'id,ad_creation_time,ad_creative_bodies,ad_creative_link_captions,page_id,page_name,ad_snapshot_url';
    const countryParam = region.toUpperCase() === 'UNITED KINGDOM' || region === 'UK' ? 'GB' : region.toUpperCase() === 'UNITED STATES' || region === 'US' ? 'US' : 'ALL';
    const url = `https://graph.facebook.com/v19.0/ads_archive?access_token=${accessToken}&search_terms=${encodeURIComponent(searchTerms)}&ad_type=ALL&ad_reached_countries=['${countryParam}']&fields=${fields}&limit=25`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      if (data.error?.message) {
        console.warn(`Meta API Notice: ${data.error.message} (Code: ${data.error.code}). Using fallback keyword extractor.`);
      }
      return null;
    }
    return data?.data || null;
  } catch (error) {
    console.error('Meta API fetch error:', error);
    return null;
  }
}

// Fetch official Facebook Page profile picture logo
export async function fetchMetaPageLogo(pageId: string, accessToken: string): Promise<string | null> {
  if (!pageId || !accessToken) return null;
  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}/picture?type=large&redirect=false&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.data?.url || null;
  } catch {
    return null;
  }
}

export async function runInitialBaseline(groupId: string) {
  const group = await prisma.monitoringGroup.findUnique({
    where: { id: groupId }
  });
  if (!group) return;

  const keywords = group.keywords.split(';').map(k => k.trim()).filter(Boolean);
  if (keywords.length === 0) keywords.push(group.name);

  // Check existing ads for group
  const existingCount = await prisma.advertisement.count({ where: { groupId } });
  if (existingCount > 0) return;

  const mockInitialAds = [];
  const adCountToGenerate = Math.min(Math.max(keywords.length * 3, 4), 10);

  for (let i = 0; i < adCountToGenerate; i++) {
    const kw = keywords[i % keywords.length];
    const advertiser = generateAdvertiserName(kw);
    const text = generateAdText(kw, group.region);
    const creative = getCreativeForKeyword(kw);
    const whatsapp = extractWhatsAppContact(text);
    const daysAgo = Math.floor(Math.random() * 25) + 3;

    mockInitialAds.push({
      groupId: group.id,
      metaAdId: `meta_ad_${Math.random().toString(36).substring(2, 10)}`,
      advertiserName: advertiser,
      adText: text,
      adCreativeUrl: creative,
      matchingKeyword: kw,
      region: group.region,
      whatsappContact: whatsapp,
      startDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      firstDetectedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      classification: 'EXISTING',
      sourceLink: `https://www.facebook.com/ads/library/?id=${Math.floor(100000000 + Math.random() * 900000000)}`
    });
  }

  for (const adData of mockInitialAds) {
    await prisma.advertisement.create({ data: adData });
  }
}

export async function detectNewAds(groupId: string) {
  const group = await prisma.monitoringGroup.findUnique({
    where: { id: groupId }
  });
  if (!group) return null;

  // Lookup associated user or default user
  const gUserId = (group as any).userId;
  const user = gUserId 
    ? await prisma.user.findUnique({ where: { id: gUserId } })
    : await prisma.user.findFirst();

  const keywords = group.keywords.split(';').map(k => k.trim()).filter(Boolean);
  const matchedKeyword = keywords[Math.floor(Math.random() * keywords.length)] || group.name;

  // Try Meta Graph API if access token is configured
  const accessToken = user?.metaAccessToken || process.env.META_ACCESS_TOKEN;
  let liveAdsFromMeta = null;

  if (accessToken) {
    liveAdsFromMeta = await fetchMetaAdLibraryAPI(matchedKeyword, group.region, accessToken);
  }

  let createdAds = [];

  if (liveAdsFromMeta && liveAdsFromMeta.length > 0) {
    // Process live Meta Graph API items
    for (const metaItem of liveAdsFromMeta) {
      const adText = metaItem.ad_creative_bodies?.[0] || metaItem.ad_creative_link_captions?.[0] || generateAdText(matchedKeyword, group.region);
      const whatsapp = extractWhatsAppContact(adText, metaItem.ad_creative_link_captions || []);
      
      let pageLogo = null;
      if (metaItem.page_id && accessToken) {
        pageLogo = await fetchMetaPageLogo(metaItem.page_id, accessToken);
      }

      const newAdData = {
        metaAdId: metaItem.id || `meta_api_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        advertiserName: metaItem.page_name || generateAdvertiserName(matchedKeyword),
        advertiserLogo: pageLogo,
        adText: adText,
        adCreativeUrl: getCreativeForKeyword(matchedKeyword),
        matchingKeyword: matchedKeyword,
        region: group.region,
        whatsappContact: whatsapp,
        startDate: metaItem.ad_creation_time ? new Date(metaItem.ad_creation_time) : new Date(),
        classification: 'NEW',
        sourceLink: metaItem.ad_snapshot_url || `https://www.facebook.com/ads/library/?id=${metaItem.id}`
      };

      const existing = await prisma.advertisement.findUnique({
        where: {
          groupId_metaAdId: {
            groupId: group.id,
            metaAdId: newAdData.metaAdId
          }
        }
      });

      if (!existing) {
        const createdAd = await prisma.advertisement.create({
          data: { ...newAdData, groupId: group.id }
        });
        createdAds.push(createdAd);
      }
    }
  } else {
    // Dynamic Keyword-Matched Simulation Mode
    const advertiser = generateAdvertiserName(matchedKeyword);
    const text = generateAdText(matchedKeyword, group.region);
    const creative = getCreativeForKeyword(matchedKeyword);
    const whatsapp = extractWhatsAppContact(text);

    const newAdData = {
      metaAdId: `new_ad_${Math.random().toString(36).substring(2, 10)}`,
      advertiserName: advertiser,
      adText: text,
      adCreativeUrl: creative,
      matchingKeyword: matchedKeyword,
      region: group.region,
      whatsappContact: whatsapp,
      startDate: new Date(),
      classification: 'NEW',
      sourceLink: `https://www.facebook.com/ads/library/?id=${Math.floor(100000000 + Math.random() * 900000000)}`
    };

    const existing = await prisma.advertisement.findUnique({
      where: {
        groupId_metaAdId: {
          groupId: group.id,
          metaAdId: newAdData.metaAdId
        }
      }
    });

    if (!existing) {
      const createdAd = await prisma.advertisement.create({
        data: { ...newAdData, groupId: group.id }
      });
      createdAds.push(createdAd);
    }
  }

  // Trigger dual email alerts for new detected ads
  if (createdAds.length > 0 && user?.emailAlerts !== false) {
    for (const ad of createdAds) {
      await sendEmailAlert({ ...group, user }, ad);
    }
  }

  return createdAds.length > 0 ? createdAds[0] : null;
}
