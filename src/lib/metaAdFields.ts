/** First non-empty string from a Meta string array field. */
export function firstMetaString(values: unknown): string | null {
  if (!Array.isArray(values)) return null;
  for (const v of values) {
    const s = String(v || '').trim();
    if (s) return s;
  }
  return null;
}

/** Join all non-empty Meta strings (carousel / multivariate ads). */
export function joinMetaStrings(values: unknown, separator = '\n\n'): string | null {
  if (!Array.isArray(values)) return null;
  const parts = values.map((v) => String(v || '').trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(separator) : null;
}

export type ParsedMetaAd = {
  adText: string | null;
  adTitle: string | null;
  adDescription: string | null;
  advertiserLink: string | null;
};

/** Map Meta Ads Library fields to Entiix ad copy fields — no synthetic fallbacks. */
export function parseMetaAdFields(metaItem: Record<string, unknown>): ParsedMetaAd {
  const bodies = joinMetaStrings(metaItem.ad_creative_bodies);
  const title = firstMetaString(metaItem.ad_creative_link_titles);
  const description = firstMetaString(metaItem.ad_creative_link_descriptions);
  const caption = firstMetaString(metaItem.ad_creative_link_captions);

  return {
    adText: bodies,
    adTitle: title,
    adDescription: description,
    advertiserLink: caption,
  };
}

export function hasMinimumMetaAdContent(parsed: ParsedMetaAd, pageName?: string | null): boolean {
  return !!(
    parsed.adText ||
    parsed.adTitle ||
    parsed.adDescription ||
    (pageName && String(pageName).trim())
  );
}
