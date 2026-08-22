/** Shared region options for monitoring groups + Meta Ads Library country codes. */
export const REGION_OPTIONS: { value: string; label: string; countryCode: string }[] = [
  { value: 'United Kingdom', label: 'United Kingdom (UK)', countryCode: 'GB' },
  { value: 'United States', label: 'United States (US)', countryCode: 'US' },
  { value: 'Global', label: 'Global / Worldwide', countryCode: 'US' },
  { value: 'Canada', label: 'Canada (CA)', countryCode: 'CA' },
  { value: 'Australia', label: 'Australia (AU)', countryCode: 'AU' },
  { value: 'Europe', label: 'Europe (EU)', countryCode: 'DE' },
  { value: 'India', label: 'India (IN)', countryCode: 'IN' },
  { value: 'Pakistan', label: 'Pakistan (PK)', countryCode: 'PK' },
  { value: 'Bangladesh', label: 'Bangladesh (BD)', countryCode: 'BD' },
  { value: 'Brazil', label: 'Brazil (BR)', countryCode: 'BR' },
  { value: 'Mexico', label: 'Mexico (MX)', countryCode: 'MX' },
  { value: 'Portugal', label: 'Portugal (PT)', countryCode: 'PT' },
  { value: 'Malaysia', label: 'Malaysia (MY)', countryCode: 'MY' },
  { value: 'Singapore', label: 'Singapore (SG)', countryCode: 'SG' },
  { value: 'Sweden', label: 'Sweden (SE)', countryCode: 'SE' },
  { value: 'Hungary', label: 'Hungary (HU)', countryCode: 'HU' },
];

/** ISO country codes for Meta Ads Library `ad_reached_countries`. */
export function resolveMetaCountries(region: string): string[] {
  const r = (region || '').trim();
  const upper = r.toUpperCase();

  if (upper === 'GLOBAL' || upper === 'GLOBAL / WORLDWIDE' || upper === 'WORLDWIDE') {
    return ['US', 'GB', 'IN', 'PK', 'BD', 'CA', 'AU', 'DE', 'BR', 'MX', 'PT', 'MY', 'SG', 'SE', 'HU'];
  }

  if (upper === 'EUROPE' || upper === 'EU') {
    return ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'PT', 'HU'];
  }

  const fromList = REGION_OPTIONS.find(
    (o) => o.value.toUpperCase() === upper || o.countryCode === upper
  );
  if (fromList) return [fromList.countryCode];

  const aliases: Record<string, string> = {
    UK: 'GB',
    GB: 'GB',
    USA: 'US',
    US: 'US',
    ALL: 'US',
    WORLDWIDE: 'US',
    PRUTEGAL: 'PT',
    SWEDAN: 'SE',
    HUNGRY: 'HU',
  };
  if (aliases[upper]) return [aliases[upper]];
  if (/^[A-Z]{2}$/.test(upper)) return [upper];

  return ['US'];
}

export function formatMetaCountriesParam(countries: string[]): string {
  const unique = Array.from(new Set(countries.map((c) => c.toUpperCase())));
  return `[${unique.map((c) => `'${c}'`).join(',')}]`;
}

export function resolveMetaCountry(region: string): string {
  return resolveMetaCountries(region)[0] || 'US';
}
