import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  buildMetaSnapshotUrl,
  resolveMetaAccessToken,
  validateMetaAdIdParam,
} from '@/lib/metaSnapshot';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ metaAdId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { metaAdId: rawId } = await params;
  const metaAdId = validateMetaAdIdParam(rawId);
  if (!metaAdId) {
    return new Response('Invalid ad id', { status: 400 });
  }

  const token = await resolveMetaAccessToken();
  if (!token) {
    return new Response('Meta access token not configured', { status: 503 });
  }

  try {
    const snapshotUrl = buildMetaSnapshotUrl(metaAdId, token);
    const upstream = await fetch(snapshotUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return new Response('Failed to load ad snapshot', { status: upstream.status });
    }

    const html = await upstream.text();

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, max-age=3600',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (error) {
    console.error('Ad preview proxy failed:', error);
    return new Response('Preview unavailable', { status: 502 });
  }
}
