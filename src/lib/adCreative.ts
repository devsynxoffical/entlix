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
