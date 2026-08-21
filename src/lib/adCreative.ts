/** Keyword-matched placeholder creatives (Meta Ads Library API does not return image files). */
const CATEGORY_IMAGES: Record<string, string[]> = {
  saas: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
  ],
  ecom: [
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
  ],
  dental: [
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
  ],
  realestate: [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
  ],
};

export function getCreativeForKeyword(keyword: string): string {
  const k = (keyword || '').toLowerCase();
  let pool = CATEGORY_IMAGES.default;
  if (k.includes('dent') || k.includes('teeth') || k.includes('clinic')) pool = CATEGORY_IMAGES.dental;
  else if (k.includes('saas') || k.includes('soft') || k.includes('app') || k.includes('lead') || k.includes('automation')) pool = CATEGORY_IMAGES.saas;
  else if (k.includes('estate') || k.includes('house') || k.includes('home') || k.includes('property')) pool = CATEGORY_IMAGES.realestate;
  else if (k.includes('shop') || k.includes('store') || k.includes('brand') || k.includes('sale')) pool = CATEGORY_IMAGES.ecom;

  // Stable pick per keyword so the same ad doesn't reshuffle on every render
  let hash = 0;
  for (let i = 0; i < k.length; i++) hash = (hash * 31 + k.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

/** Meta ad_snapshot_url points to an HTML preview page — never a usable <img> src. */
export function isNonImageCreativeUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  const u = url.toLowerCase();
  return (
    u.includes('facebook.com/ads/library') ||
    u.includes('facebook.com/ads/archive') ||
    u.includes('www.facebook.com/ads/') ||
    u.includes('fb.com/ads') ||
    u.includes('ad_snapshot') ||
    u.includes('/ads/library/')
  );
}

export function isDisplayableImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (isNonImageCreativeUrl(url)) return false;
  return (
    url.startsWith('https://') ||
    url.startsWith('http://') ||
    url.startsWith('data:image')
  );
}

/** Resolve a creative URL safe for <img>, falling back to keyword placeholders. */
export function resolveAdCreativeUrl(
  adCreativeUrl: string | null | undefined,
  matchingKeyword?: string | null
): string {
  if (isDisplayableImageUrl(adCreativeUrl) && adCreativeUrl) return adCreativeUrl;
  return getCreativeForKeyword(matchingKeyword || 'default');
}

/** Real Meta Ads Library archive IDs are long numeric strings. */
export function isRealMetaAdId(metaAdId: string | null | undefined): boolean {
  if (!metaAdId) return false;
  const id = String(metaAdId).trim();
  // Reject sim_/meta_ad_/new_ad_ and short random placeholders
  if (!/^\d{10,}$/.test(id)) return false;
  return true;
}

export function isSimulatedAd(metaAdId: string | null | undefined): boolean {
  if (!metaAdId) return true;
  const id = String(metaAdId).trim().toLowerCase();
  return (
    id.startsWith('sim_') ||
    id.startsWith('meta_ad_') ||
    id.startsWith('new_ad_') ||
    id.startsWith('meta_api_') ||
    !isRealMetaAdId(id)
  );
}

/** Public Ad Library permalink — works in a browser without Graph API tokens. */
export function publicMetaLibraryUrl(metaAdId: string | null | undefined): string | null {
  if (!isRealMetaAdId(metaAdId)) return null;
  return `https://www.facebook.com/ads/library/?id=${encodeURIComponent(String(metaAdId).trim())}`;
}

/**
 * Snapshot URLs (`/ads/archive/render_ad/?…&access_token=…`) require login and
 * leak API tokens. Always prefer the public library permalink instead.
 */
export function isPrivateMetaSnapshotUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes('access_token=') ||
    u.includes('/ads/archive/render_ad') ||
    u.includes('ad_snapshot') ||
    (u.includes('facebook.com') && u.includes('render_ad'))
  );
}

/** Extract a numeric Meta ad id from a library/snapshot URL when possible. */
export function extractMetaAdIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const fromQuery = parsed.searchParams.get('id');
    if (fromQuery && isRealMetaAdId(fromQuery)) return fromQuery;
  } catch {
    // fall through
  }
  const match = url.match(/[?&]id=(\d{10,})/);
  return match?.[1] || null;
}

/**
 * Safe browser link for "Open Live Ad" / "Meta Library".
 * Demo/simulated ads never get a Meta Library URL (fake ids show "ad doesn't exist").
 */
export function resolveSourceLink(
  sourceLink: string | null | undefined,
  metaAdId?: string | null
): string | null {
  // Only real Meta archive ids open in Ad Library
  if (isRealMetaAdId(metaAdId)) {
    return publicMetaLibraryUrl(metaAdId);
  }

  // If metaAdId is simulated, ignore any stored facebook.com/ads/library fake link
  if (isSimulatedAd(metaAdId)) {
    return null;
  }

  if (!sourceLink) return null;
  if (isPrivateMetaSnapshotUrl(sourceLink)) {
    return publicMetaLibraryUrl(extractMetaAdIdFromUrl(sourceLink));
  }

  if (sourceLink.includes('facebook.com/ads/library')) {
    return publicMetaLibraryUrl(extractMetaAdIdFromUrl(sourceLink));
  }

  return null;
}
