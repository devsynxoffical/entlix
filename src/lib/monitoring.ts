import prisma from './db';
import { isRealMetaAdId } from './adCreative';
import {
  hasMinimumMetaAdContent,
  parseMetaAdFields,
} from './metaAdFields';
import { formatMetaCountriesParam, resolveMetaCountries } from './regions';

export const AD_RETENTION_DAYS = 7;

/** Remove ads older than the retention window (default 7 days). */
export async function purgeExpiredAds(groupId?: string): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - AD_RETENTION_DAYS);
  cutoff.setHours(0, 0, 0, 0);

  const result = await prisma.advertisement.deleteMany({
    where: {
      ...(groupId ? { groupId } : {}),
      firstDetectedAt: { lt: cutoff },
    },
  });

  if (result.count > 0) {
    console.log(
      `🗑️ Purged ${result.count} ad(s) older than ${AD_RETENTION_DAYS} days${groupId ? ` in group ${groupId}` : ''}`
    );
  }
  return result.count;
}

export function adContentFingerprint(advertiserName?: string | null, adText?: string | null): string {
  const name = (advertiserName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const text = (adText || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 400);
  return `${name}||${text}`;
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

// Extractor for WhatsApp links & phone numbers from ad copy & captions
function extractWhatsAppContact(text: string, extra: string[] = []): string | null {
  const combined = [text, ...extra].join(' ');

  const waLinkMatch = combined.match(/(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com\/send\?phone=)(\d+)/i);
  if (waLinkMatch && waLinkMatch[1]) {
    return waLinkMatch[1];
  }

  const phoneMatch = combined.match(/(?:\+|00)\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);
  if (phoneMatch) {
    const rawNumber = phoneMatch[0].replace(/[^0-9]/g, '');
    if (rawNumber.length >= 8 && rawNumber.length <= 15) {
      return rawNumber;
    }
  }

  return null;
}

export async function fetchMetaAdLibraryAPI(
  searchTerms: string,
  region: string,
  accessToken: string
): Promise<{ data: any[] | null; errorCode?: number; errorMessage?: string }> {
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

    const countries = resolveMetaCountries(region);
    const countryParam = formatMetaCountriesParam(countries);

    const url =
      `https://graph.facebook.com/v19.0/ads_archive` +
      `?access_token=${encodeURIComponent(accessToken)}` +
      `&search_terms=${encodeURIComponent(searchTerms)}` +
      `&ad_type=ALL` +
      `&ad_reached_countries=${encodeURIComponent(countryParam)}` +
      `&ad_active_status=ACTIVE` +
      `&fields=${fields}` +
      `&limit=25`;

    console.log(
      `🔍 Meta search: keyword="${searchTerms}" region="${region}" countries=${countryParam}`
    );

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      const errorCode = data.error?.code;
      const errorMessage = data.error?.message || `HTTP ${response.status}`;
      console.warn(`Meta API Notice: ${errorMessage} (Code: ${errorCode}).`);
      return { data: null, errorCode, errorMessage };
    }
    return { data: data?.data || [] };
  } catch (error: any) {
    console.error('Meta API fetch error:', error);
    return { data: null, errorMessage: error?.message || 'network error' };
  }
}

/** Prefer Railway/env token, then Settings token. Retry the other if first is expired (190). */
async function fetchMetaAdsWithBestToken(
  searchTerms: string,
  region: string,
  userToken?: string | null
): Promise<any[] | null> {
  const envToken = (process.env.META_ACCESS_TOKEN || '').trim() || null;
  const dbToken = (userToken || '').trim() || null;

  const candidates = Array.from(new Set([envToken, dbToken].filter(Boolean))) as string[];

  if (candidates.length === 0) {
    console.warn('⚠️ No META_ACCESS_TOKEN (env) or Settings metaAccessToken configured.');
    return null;
  }

  for (let i = 0; i < candidates.length; i++) {
    const token = candidates[i];
    const source = token === envToken ? 'META_ACCESS_TOKEN (Railway/env)' : 'Settings (database)';
    console.log(`🔑 Trying Meta token from ${source}…`);
    const result = await fetchMetaAdLibraryAPI(searchTerms, region, token);

    if (result.data) {
      console.log(`✅ Meta API OK via ${source} — ${result.data.length} ad(s) for "${searchTerms}"`);
      return result.data;
    }

    if (result.errorCode === 190 && i < candidates.length - 1) {
      console.warn(`⚠️ Token from ${source} expired/invalid (190). Trying fallback token…`);
      continue;
    }

    console.warn(`❌ Meta API failed via ${source}: ${result.errorMessage}`);
  }

  return null;
}

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
  const group = await prisma.monitoringGroup.findUnique({ where: { id: groupId } });
  if (!group) return;
}

export async function purgeDemoAds(groupId?: string): Promise<number> {
  const ads = await prisma.advertisement.findMany({
    where: groupId ? { groupId } : undefined,
    select: { id: true, metaAdId: true },
  });

  const toDelete = ads.filter((a) => !isRealMetaAdId(a.metaAdId)).map((a) => a.id);
  if (toDelete.length === 0) return 0;

  await prisma.advertisement.deleteMany({ where: { id: { in: toDelete } } });
  console.log(`🧹 Removed ${toDelete.length} demo/simulated ad(s)`);
  return toDelete.length;
}

export async function detectNewAds(groupId: string): Promise<any[]> {
  const group = await prisma.monitoringGroup.findUnique({
    where: { id: groupId },
  });
  if (!group) return [];

  await purgeDuplicateAds(group.id);
  await purgeDemoAds(group.id);
  await purgeExpiredAds(group.id);

  const gUserId = (group as any).userId;
  const user = gUserId
    ? await prisma.user.findUnique({ where: { id: gUserId } })
    : await prisma.user.findFirst();

  const keywords = group.keywords.split(';').map((k) => k.trim()).filter(Boolean);
  if (keywords.length === 0) {
    console.warn(`⚠️ Group "${group.name}" has no keywords — skipping scan.`);
    return [];
  }

  const accessToken =
    (process.env.META_ACCESS_TOKEN || '').trim() ||
    (user?.metaAccessToken || '').trim() ||
    null;

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

  const tryCreate = async (newAdData: any, keywordUsed: string) => {
    const metaAdId = String(newAdData.metaAdId || '').trim();
    if (!metaAdId) return;

    const fp = adContentFingerprint(newAdData.advertiserName, newAdData.adText);

    if (existingMetaIds.has(metaAdId) || batchMetaIds.has(metaAdId)) return;
    if (fp && (existingFingerprints.has(fp) || batchFingerprints.has(fp))) return;

    try {
      const createdAd = await prisma.advertisement.create({
        data: {
          ...newAdData,
          groupId: group.id,
          metaAdId,
          matchingKeyword: keywordUsed,
          region: group.region,
        },
      });
      createdAds.push({
        ...createdAd,
        groupName: group.name,
      });
      existingMetaIds.add(metaAdId);
      batchMetaIds.add(metaAdId);
      if (fp) {
        existingFingerprints.add(fp);
        batchFingerprints.add(fp);
      }
    } catch (error: any) {
      if (error?.code === 'P2002') return;
      throw error;
    }
  };

  let totalFetched = 0;

  for (const keyword of keywords) {
    const liveAdsFromMeta = await fetchMetaAdsWithBestToken(
      keyword,
      group.region,
      user?.metaAccessToken
    );

    if (!liveAdsFromMeta || liveAdsFromMeta.length === 0) {
      console.log(
        `ℹ️ No Meta ads for group "${group.name}" keyword="${keyword}" region="${group.region}".`
      );
      continue;
    }

    totalFetched += liveAdsFromMeta.length;

    for (const metaItem of liveAdsFromMeta) {
      if (!metaItem.id) continue;

      const parsed = parseMetaAdFields(metaItem);
      const pageName = metaItem.page_name ? String(metaItem.page_name).trim() : null;

      if (!hasMinimumMetaAdContent(parsed, pageName)) continue;

      const whatsapp = extractWhatsAppContact(
        [parsed.adText, parsed.adTitle, parsed.adDescription].filter(Boolean).join(' '),
        parsed.advertiserLink ? [parsed.advertiserLink] : []
      );

      let pageLogo = null;
      if (metaItem.page_id && accessToken) {
        pageLogo = await fetchMetaPageLogo(metaItem.page_id, accessToken);
      }

      await tryCreate(
        {
          metaAdId: String(metaItem.id),
          advertiserName: pageName || 'Unknown advertiser',
          advertiserLogo: pageLogo,
          advertiserLink: parsed.advertiserLink,
          adText: parsed.adText,
          adTitle: parsed.adTitle,
          adDescription: parsed.adDescription,
          adCreativeUrl: null,
          whatsappContact: whatsapp,
          startDate: metaItem.ad_creation_time ? new Date(metaItem.ad_creation_time) : new Date(),
          classification: 'NEW',
          sourceLink: `https://www.facebook.com/ads/library/?id=${metaItem.id}`,
        },
        keyword
      );
    }
  }

  if (createdAds.length === 0 && totalFetched === 0) {
    console.log(`ℹ️ No live Meta results for group "${group.name}" across ${keywords.length} keyword(s).`);
  } else {
    console.log(
      `📊 Group "${group.name}": ${createdAds.length} new ad(s) from ${keywords.length} keyword(s), region="${group.region}".`
    );
  }

  return createdAds;
}
