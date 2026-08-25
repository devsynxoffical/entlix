import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

function maskSecret(value: string | null | undefined): string {
  if (!value) return '';
  if (value.length <= 12) return '••••••••';
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function resolveTelegramConfig(user: {
  telegramApiId?: string | null;
  telegramApiHash?: string | null;
  telegramSession?: string | null;
}) {
  const apiId = (user.telegramApiId || process.env.TELEGRAM_API_ID || '').trim();
  const apiHash = (user.telegramApiHash || process.env.TELEGRAM_API_HASH || '').trim();
  const session = (user.telegramSession || process.env.TELEGRAM_SESSION || '').trim();
  return {
    apiId,
    apiHash,
    session,
    connected: !!(apiId && apiHash && session),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    let user = null;
    if (userEmail) {
      user = await prisma.user.findUnique({ where: { email: userEmail } });
    } else {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return NextResponse.json({
        defaultRegion: 'Global',
        emailAlerts: true,
        metaAccessToken: '',
        slackWebhookUrl: '',
        discordWebhookUrl: '',
        telegramApiId: '',
        telegramApiHash: '',
        telegramConnected: false,
        telegramSessionHint: '',
        telegramApiHashHint: '',
      });
    }

    const tg = resolveTelegramConfig(user);

    return NextResponse.json({
      email: user.email,
      defaultRegion: user.defaultRegion || 'Global',
      emailAlerts: user.emailAlerts !== false,
      metaAccessToken: user.metaAccessToken || '',
      slackWebhookUrl: user.slackWebhookUrl || '',
      discordWebhookUrl: user.discordWebhookUrl || '',
      // API ID is not highly sensitive — return stored (or env) for editing
      telegramApiId: tg.apiId,
      // Don't return full hash/session; hints only
      telegramApiHash: '',
      telegramApiHashHint: maskSecret(tg.apiHash),
      telegramConnected: tg.connected,
      telegramSessionHint: maskSecret(tg.session),
      telegramHasApiHash: !!tg.apiHash,
      telegramHasSession: !!tg.session,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const {
      defaultRegion,
      emailAlerts,
      metaAccessToken,
      slackWebhookUrl,
      discordWebhookUrl,
      telegramApiId,
      telegramApiHash,
      telegramSession,
    } = body;

    const userEmail = session?.user?.email;
    let user = null;

    if (userEmail) {
      user = await prisma.user.findUnique({ where: { email: userEmail } });
    } else {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {
      defaultRegion: defaultRegion ?? user.defaultRegion,
      emailAlerts: emailAlerts ?? user.emailAlerts,
      metaAccessToken: metaAccessToken !== undefined ? metaAccessToken : user.metaAccessToken,
      slackWebhookUrl: slackWebhookUrl !== undefined ? slackWebhookUrl : user.slackWebhookUrl,
      discordWebhookUrl:
        discordWebhookUrl !== undefined ? discordWebhookUrl : user.discordWebhookUrl,
    };

    if (telegramApiId !== undefined) {
      const trimmed = String(telegramApiId || '').trim();
      data.telegramApiId = trimmed || null;
    }

    // Only update hash/session when user sends a non-empty new value
    if (typeof telegramApiHash === 'string' && telegramApiHash.trim()) {
      data.telegramApiHash = telegramApiHash.trim();
    }

    if (typeof telegramSession === 'string' && telegramSession.trim()) {
      data.telegramSession = telegramSession.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
    });

    const tg = resolveTelegramConfig(updatedUser);

    return NextResponse.json({
      success: true,
      defaultRegion: updatedUser.defaultRegion,
      emailAlerts: updatedUser.emailAlerts,
      metaAccessToken: updatedUser.metaAccessToken,
      slackWebhookUrl: updatedUser.slackWebhookUrl,
      discordWebhookUrl: updatedUser.discordWebhookUrl,
      telegramApiId: tg.apiId,
      telegramApiHash: '',
      telegramApiHashHint: maskSecret(tg.apiHash),
      telegramConnected: tg.connected,
      telegramSessionHint: maskSecret(tg.session),
      telegramHasApiHash: !!tg.apiHash,
      telegramHasSession: !!tg.session,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
