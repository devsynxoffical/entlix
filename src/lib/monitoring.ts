import prisma from './db';
import { getCreativeForKeyword } from './adCreative';
import { resolveMetaCountry } from './regions';

/** Stable fingerprint to catch near-duplicate creatives (same page + same copy). */
export function adContentFingerprint(advertiserName?: string | null, adText?: string | null): string {
  const name = (advertiserName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const text = (adText || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 400);
  return `${name}||${text}`;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Remove duplicate rows in a group (keep oldest). Same metaAdId or same content fingerprint. */
export async function purgeDuplicateAds(groupId?: string): Promise<number> {
  const ads = await prisma.advertisement.findMany({
    where: groupId ? { groupId } : undefined,
    orderBy: { firstDetectedAt: 'asc' },
    select: {
      id: true,
      groupId: true,
      metaAdId: true,
      advertiserName: true,
      adText: true,
    },
  });

  const seenMeta = new Set<string>();
  const seenContent = new Set<string>();
  const toDelete: string[] = [];

  for (const ad of ads) {
    const metaKey = `${ad.groupId}::${ad.metaAdId}`;
    const contentKey = `${ad.groupId}::${adContentFingerprint(ad.advertiserName, ad.adText)}`;

    const metaDup = seenMeta.has(metaKey);
    const contentDup = !!ad.adText && seenContent.has(contentKey);

    if (metaDup || contentDup) {
      toDelete.push(ad.id);
      continue;
    }

    seenMeta.add(metaKey);
    if (ad.adText) seenContent.add(contentKey);
  }

  if (toDelete.length === 0) return 0;

  await prisma.advertisement.deleteMany({ where: { id: { in: toDelete } } });
  console.log(`🧹 Purged ${toDelete.length} duplicate ad(s)${groupId ? ` in group ${groupId}` : ''}`);
  return toDelete.length;
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
    const fields = [
      'id',
      'ad_creation_time',
      'ad_creative_bodies',
      'ad_creative_link_captions',
      'ad_creative_link_titles',
      'ad_creative_link_descriptions',
      'page_id',
      'page_name',
      'ad_snapshot_url',
      'publisher_platforms',
    ].join(',');
    const countryParam = resolveMetaCountry(region);
    const url =
      `https://graph.facebook.com/v19.0/ads_archive` +
      `?access_token=${accessToken}` +
      `&search_terms=${encodeURIComponent(searchTerms)}` +
      `&ad_type=ALL` +
      `&ad_reached_countries=['${countryParam}']` +
      `&ad_active_status=ACTIVE` +
      `&fields=${fields}` +
      `&limit=25`;

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
      sourceLink: null, // Demo baseline — no fake Meta Library id
    });
  }

  for (const adData of mockInitialAds) {
    await prisma.advertisement.create({ data: adData });
  }
}

export async function detectNewAds(groupId: string): Promise<any[]> {
  const group = await prisma.monitoringGroup.findUnique({
    where: { id: groupId },
  });
  if (!group) return [];

  // Clean existing duplicates before inserting more
  await purgeDuplicateAds(group.id);

  const gUserId = (group as any).userId;
  const user = gUserId
    ? await prisma.user.findUnique({ where: { id: gUserId } })
    : await prisma.user.findFirst();

  const keywords = group.keywords.split(';').map((k) => k.trim()).filter(Boolean);
  const matchedKeyword = keywords[Math.floor(Math.random() * keywords.length)] || group.name;

  const accessToken = user?.metaAccessToken || process.env.META_ACCESS_TOKEN;
  let liveAdsFromMeta = null;

  if (accessToken) {
    liveAdsFromMeta = await fetchMetaAdLibraryAPI(matchedKeyword, group.region, accessToken);
  }

  // Load existing meta ids + content fingerprints for this group (dedupe gate)
  const existingAds = await prisma.advertisement.findMany({
    where: { groupId: group.id },
    select: { metaAdId: true, advertiserName: true, adText: true },
  });
  const existingMetaIds = new Set(existingAds.map((a) => a.metaAdId));
  const existingFingerprints = new Set(
    existingAds.map((a) => adContentFingerprint(a.advertiserName, a.adText))
  );

  const createdAds: any[] = [];
  const batchFingerprints = new Set<string>();
  const batchMetaIds = new Set<string>();

  const tryCreate = async (newAdData: any) => {
    const metaAdId = String(newAdData.metaAdId || '').trim();
    if (!metaAdId) return;

    const fp = adContentFingerprint(newAdData.advertiserName, newAdData.adText);

    if (existingMetaIds.has(metaAdId) || batchMetaIds.has(metaAdId)) return;
    if (fp && (existingFingerprints.has(fp) || batchFingerprints.has(fp))) return;

    try {
      const createdAd = await prisma.advertisement.create({
        data: { ...newAdData, groupId: group.id, metaAdId },
      });
      createdAds.push(createdAd);
      existingMetaIds.add(metaAdId);
      batchMetaIds.add(metaAdId);
      if (fp) {
        existingFingerprints.add(fp);
        batchFingerprints.add(fp);
      }
    } catch (error: any) {
      // Unique constraint race — treat as duplicate, skip
      if (error?.code === 'P2002') return;
      throw error;
    }
  };

  if (liveAdsFromMeta && liveAdsFromMeta.length > 0) {
    for (const metaItem of liveAdsFromMeta) {
      // Skip items without a real Meta archive id (random ids cause duplicates)
      if (!metaItem.id) continue;

      const adText =
        metaItem.ad_creative_bodies?.[0] ||
        metaItem.ad_creative_link_captions?.[0] ||
        null;
      if (!adText && !metaItem.page_name) continue;

      const whatsapp = extractWhatsAppContact(adText || '', metaItem.ad_creative_link_captions || []);

      let pageLogo = null;
      if (metaItem.page_id && accessToken) {
        pageLogo = await fetchMetaPageLogo(metaItem.page_id, accessToken);
      }

      const linkCaption =
        metaItem.ad_creative_link_captions?.[0] ||
        metaItem.ad_creative_link_titles?.[0] ||
        null;

      await tryCreate({
        metaAdId: String(metaItem.id),
        advertiserName: metaItem.page_name || generateAdvertiserName(matchedKeyword),
        advertiserLogo: pageLogo,
        advertiserLink: linkCaption,
        adText: adText || generateAdText(matchedKeyword, group.region),
        adCreativeUrl: getCreativeForKeyword(matchedKeyword),
        matchingKeyword: matchedKeyword,
        region: group.region,
        whatsappContact: whatsapp,
        startDate: metaItem.ad_creation_time ? new Date(metaItem.ad_creation_time) : new Date(),
        classification: 'NEW',
        sourceLink: `https://www.facebook.com/ads/library/?id=${metaItem.id}`,
      });
    }
  } else {
    // Simulation fallback — deterministic id per group/keyword/day so hourly cron cannot spam duplicates
    const simId = `sim_${group.id.slice(0, 8)}_${matchedKeyword.toLowerCase().replace(/\s+/g, '_')}_${todayKey()}`;
    if (!existingMetaIds.has(simId)) {
      const advertiser = generateAdvertiserName(matchedKeyword);
      const text = generateAdText(matchedKeyword, group.region);
      await tryCreate({
        metaAdId: simId,
        advertiserName: advertiser,
        adText: text,
        adCreativeUrl: getCreativeForKeyword(matchedKeyword),
        matchingKeyword: matchedKeyword,
        region: group.region,
        whatsappContact: extractWhatsAppContact(text),
        startDate: new Date(),
        classification: 'NEW',
        sourceLink: null, // Demo simulation — Meta Library link only for live Meta archive ids
      });
    }
  }

  // Email is sent by the caller (cron / scan-all) as ONE bulk summary — not per ad here.
  return createdAds;
}
