import prisma from './db';
import { AD_RETENTION_DAYS } from './monitoring';
import { delayBetweenTelegramSearches, searchPublicGroups } from './telegram';

export async function purgeExpiredTelegramGroups(keywordId?: string): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - AD_RETENTION_DAYS);
  cutoff.setHours(0, 0, 0, 0);

  const result = await prisma.telegramGroup.deleteMany({
    where: {
      ...(keywordId ? { keywordId } : {}),
      firstDetectedAt: { lt: cutoff },
    },
  });

  if (result.count > 0) {
    console.log(
      `🗑️ Purged ${result.count} Telegram group(s) older than ${AD_RETENTION_DAYS} days` +
        (keywordId ? ` for keyword ${keywordId}` : '')
    );
  }
  return result.count;
}

export async function detectNewTelegramGroups(keywordId: string): Promise<any[]> {
  const row = await prisma.telegramKeyword.findUnique({ where: { id: keywordId } });
  if (!row || row.status !== 'ACTIVE') return [];

  await purgeExpiredTelegramGroups(keywordId);

  const existing = await prisma.telegramGroup.findMany({
    where: { keywordId },
    select: { telegramId: true },
  });
  const existingIds = new Set(existing.map((g) => g.telegramId));

  const { hits, error } = await searchPublicGroups(row.keyword, 25);
  if (error && hits.length === 0) {
    console.warn(`ℹ️ Telegram scan for "${row.keyword}" failed: ${error}`);
    return [];
  }

  const created: any[] = [];
  const batchIds = new Set<string>();

  for (const hit of hits) {
    if (existingIds.has(hit.telegramId) || batchIds.has(hit.telegramId)) {
      // Refresh lastDetectedAt for known groups
      try {
        await prisma.telegramGroup.updateMany({
          where: { keywordId, telegramId: hit.telegramId },
          data: {
            lastDetectedAt: new Date(),
            classification: 'EXISTING',
            title: hit.title,
            username: hit.username,
            inviteLink: hit.inviteLink,
            about: hit.about,
            participantsCount: hit.participantsCount,
            isChannel: hit.isChannel,
          },
        });
      } catch {
        // ignore update races
      }
      continue;
    }

    try {
      const group = await prisma.telegramGroup.create({
        data: {
          keywordId,
          telegramId: hit.telegramId,
          title: hit.title,
          username: hit.username,
          inviteLink: hit.inviteLink,
          about: hit.about,
          participantsCount: hit.participantsCount,
          isChannel: hit.isChannel,
          matchingKeyword: row.keyword,
          classification: 'NEW',
        },
      });
      created.push({ ...group, keywordLabel: row.keyword });
      existingIds.add(hit.telegramId);
      batchIds.add(hit.telegramId);
    } catch (error: any) {
      if (error?.code === 'P2002') continue;
      throw error;
    }
  }

  console.log(
    `📊 Telegram keyword "${row.keyword}": ${created.length} new group(s) from ${hits.length} hit(s).`
  );
  return created;
}

/** Scan all ACTIVE Telegram keywords with a short delay between searches. */
export async function scanAllTelegramKeywords(): Promise<{
  keywordsScanned: number;
  newGroups: any[];
}> {
  const keywords = await prisma.telegramKeyword.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });

  const newGroups: any[] = [];
  for (let i = 0; i < keywords.length; i++) {
    if (i > 0) await delayBetweenTelegramSearches(1500);
    const created = await detectNewTelegramGroups(keywords[i].id);
    newGroups.push(...created);
  }

  return { keywordsScanned: keywords.length, newGroups };
}
