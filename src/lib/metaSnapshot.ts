import prisma from './db';
import { isRealMetaAdId } from './adCreative';

export async function resolveMetaAccessToken(): Promise<string | null> {
  const envToken = (process.env.META_ACCESS_TOKEN || '').trim();
  if (envToken) return envToken;

  const user = await prisma.user.findFirst({
    where: { metaAccessToken: { not: null } },
    select: { metaAccessToken: true },
  });
  return (user?.metaAccessToken || '').trim() || null;
}

export function buildMetaSnapshotUrl(metaAdId: string, accessToken: string): string {
  return (
    `https://www.facebook.com/ads/archive/render_ad/` +
    `?id=${encodeURIComponent(metaAdId)}` +
    `&access_token=${encodeURIComponent(accessToken)}`
  );
}

export function validateMetaAdIdParam(metaAdId: string | undefined): string | null {
  if (!metaAdId || !isRealMetaAdId(metaAdId)) return null;
  return String(metaAdId).trim();
}
