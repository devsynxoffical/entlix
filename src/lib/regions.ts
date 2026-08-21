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

export function resolveMetaCountry(region: string): string {
  const r = (region || '').trim().toUpperCase();
  const fromList = REGION_OPTIONS.find(
    (o) => o.value.toUpperCase() === r || o.countryCode === r
  );
  if (fromList) return fromList.countryCode;

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
  if (aliases[r]) return aliases[r];
  if (/^[A-Z]{2}$/.test(r)) return r;
  return 'US';
}
