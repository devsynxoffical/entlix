import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import prisma from './db';

export type TelegramSearchHit = {
  telegramId: string;
  title: string;
  username: string | null;
  inviteLink: string | null;
  about: string | null;
  participantsCount: number | null;
  isChannel: boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resolveTelegramSession(): Promise<string | null> {
  const envSession = (process.env.TELEGRAM_SESSION || '').trim();
  if (envSession) return envSession;

  const user = await prisma.user.findFirst({
    where: { telegramSession: { not: null } },
    select: { telegramSession: true },
  });
  return (user?.telegramSession || '').trim() || null;
}

export async function getTelegramClient(): Promise<TelegramClient | null> {
  const apiIdRaw = (process.env.TELEGRAM_API_ID || '').trim();
  const apiHash = (process.env.TELEGRAM_API_HASH || '').trim();
  const session = await resolveTelegramSession();

  const apiId = Number(apiIdRaw);
  if (!apiIdRaw || !Number.isFinite(apiId) || !apiHash || !session) {
    console.warn(
      '⚠️ Telegram MTProto not configured. Set TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_SESSION (or Settings session).'
    );
    return null;
  }

  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 3,
    useWSS: true,
  });

  await client.connect();
  if (!(await client.isUserAuthorized())) {
    console.warn('⚠️ Telegram session is not authorized. Re-run scripts/telegram-login.mjs');
    await client.disconnect();
    return null;
  }

  return client;
}

function asNumber(value: unknown): number | null {
  if (value == null) return null;
  try {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function mapChat(entity: any): TelegramSearchHit | null {
  if (!entity) return null;

  const className = entity.className || entity.constructor?.name || '';
  const isChannel =
    className.includes('Channel') ||
    entity.broadcast === true ||
    entity.megagroup === true;
  const isChat = className.includes('Chat') && !className.includes('Forbidden');

  if (!isChannel && !isChat) return null;

  // Prefer public entities with username; skip private/forbidden when possible
  const username = entity.username ? String(entity.username) : null;
  const id = entity.id != null ? String(entity.id) : null;
  if (!id) return null;

  const title = String(entity.title || entity.username || 'Untitled').trim();
  if (!title) return null;

  const inviteLink = username
    ? `https://t.me/${username}`
    : entity.username
      ? `https://t.me/${entity.username}`
      : null;

  // Skip private chats without a public username (can't open reliably)
  if (!username && !inviteLink) return null;

  return {
    telegramId: id,
    title,
    username,
    inviteLink: username ? `https://t.me/${username}` : inviteLink,
    about: entity.about ? String(entity.about) : null,
    participantsCount: asNumber(entity.participantsCount),
    isChannel: Boolean(isChannel),
  };
}

/**
 * Search public Telegram groups/channels by keyword via contacts.Search.
 * Soft-capped results; caller should rate-limit between keywords.
 */
export async function searchPublicGroups(
  keyword: string,
  limit = 25
): Promise<{ hits: TelegramSearchHit[]; error?: string }> {
  const q = (keyword || '').trim();
  if (!q) return { hits: [], error: 'empty keyword' };

  let client: TelegramClient | null = null;
  try {
    client = await getTelegramClient();
    if (!client) {
      return { hits: [], error: 'Telegram client not configured or unauthorized' };
    }

    const result = await client.invoke(
      new Api.contacts.Search({
        q,
        limit: Math.min(Math.max(limit, 1), 50),
      })
    );

    const chats: any[] = (result as any)?.chats || [];
    const seen = new Set<string>();
    const hits: TelegramSearchHit[] = [];

    for (const chat of chats) {
      const mapped = mapChat(chat);
      if (!mapped) continue;
      if (seen.has(mapped.telegramId)) continue;
      seen.add(mapped.telegramId);
      hits.push(mapped);
      if (hits.length >= limit) break;
    }

    console.log(`🔍 Telegram search "${q}" → ${hits.length} public group(s)/channel(s)`);
    return { hits };
  } catch (error: any) {
    const message = error?.message || String(error);
    console.error('Telegram search failed:', message);
    return { hits: [], error: message };
  } finally {
    if (client) {
      try {
        await client.disconnect();
      } catch {
        // ignore
      }
    }
  }
}

export async function delayBetweenTelegramSearches(ms = 1500) {
  await sleep(ms);
}
