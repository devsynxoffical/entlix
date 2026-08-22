export type DateFilter =
  | 'ALL'
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'OLDER';

export type SortOrder = 'NEWEST' | 'OLDEST';

export const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'LAST_7_DAYS', label: 'Last 7 days' },
  { value: 'TODAY', label: 'Today' },
  { value: 'YESTERDAY', label: 'Yesterday' },
  { value: 'ALL', label: 'All time' },
  { value: 'LAST_30_DAYS', label: 'Last 30 days' },
  { value: 'OLDER', label: 'Older (30+ days)' },
];

export const SORT_ORDER_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'NEWEST', label: 'Latest first' },
  { value: 'OLDEST', label: 'Oldest first' },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function matchesDateFilter(
  firstDetectedAt: string | Date | null | undefined,
  filter: DateFilter
): boolean {
  if (filter === 'ALL') return true;
  if (!firstDetectedAt) return false;

  const detected = new Date(firstDetectedAt);
  if (Number.isNaN(detected.getTime())) return false;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (filter) {
    case 'TODAY':
      return detected >= todayStart && detected <= todayEnd;
    case 'YESTERDAY': {
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayStart);
      yesterdayEnd.setMilliseconds(yesterdayEnd.getMilliseconds() - 1);
      return detected >= yesterdayStart && detected <= yesterdayEnd;
    }
    case 'LAST_7_DAYS': {
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6);
      return detected >= weekStart && detected <= todayEnd;
    }
    case 'LAST_30_DAYS': {
      const monthStart = new Date(todayStart);
      monthStart.setDate(monthStart.getDate() - 29);
      return detected >= monthStart && detected <= todayEnd;
    }
    case 'OLDER': {
      const monthStart = new Date(todayStart);
      monthStart.setDate(monthStart.getDate() - 29);
      return detected < monthStart;
    }
    default:
      return true;
  }
}

export function sortAdsByDetected<T extends { firstDetectedAt?: string | Date | null }>(
  ads: T[],
  order: SortOrder
): T[] {
  return [...ads].sort((a, b) => {
    const ta = new Date(a.firstDetectedAt || 0).getTime() || 0;
    const tb = new Date(b.firstDetectedAt || 0).getTime() || 0;
    return order === 'NEWEST' ? tb - ta : ta - tb;
  });
}

export function formatDetectedLabel(firstDetectedAt: string | Date | null | undefined): string {
  if (!firstDetectedAt) return 'Unknown date';
  const d = new Date(firstDetectedAt);
  if (Number.isNaN(d.getTime())) return 'Unknown date';

  const now = new Date();
  const todayStart = startOfDay(now);
  const detectedStart = startOfDay(d);

  const diffDays = Math.round(
    (todayStart.getTime() - detectedStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function dateFilterLabel(filter: DateFilter): string {
  return DATE_FILTER_OPTIONS.find((o) => o.value === filter)?.label || filter;
}
