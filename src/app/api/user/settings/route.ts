import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

function maskSession(session: string | null | undefined): string {
  if (!session) return '';
  if (session.length <= 12) return '••••••••';
  return `${session.slice(0, 6)}…${session.slice(-4)}`;
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
        telegramConnected: false,
        telegramSessionHint: '',
      });
    }

    const hasSession = !!(user.telegramSession || process.env.TELEGRAM_SESSION);

    return NextResponse.json({
      email: user.email,
      defaultRegion: user.defaultRegion || 'Global',
      emailAlerts: user.emailAlerts !== false,
      metaAccessToken: user.metaAccessToken || '',
      slackWebhookUrl: user.slackWebhookUrl || '',
      discordWebhookUrl: user.discordWebhookUrl || '',
      telegramConnected: hasSession,
      telegramSessionHint: maskSession(user.telegramSession || process.env.TELEGRAM_SESSION),
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

    if (telegramSession !== undefined) {
      const trimmed = String(telegramSession || '').trim();
      // Empty string clears DB session (env TELEGRAM_SESSION can still apply)
      data.telegramSession = trimmed || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
    });

    const hasSession = !!(updatedUser.telegramSession || process.env.TELEGRAM_SESSION);

    return NextResponse.json({
      success: true,
      defaultRegion: updatedUser.defaultRegion,
      emailAlerts: updatedUser.emailAlerts,
      metaAccessToken: updatedUser.metaAccessToken,
      slackWebhookUrl: updatedUser.slackWebhookUrl,
      discordWebhookUrl: updatedUser.discordWebhookUrl,
      telegramConnected: hasSession,
      telegramSessionHint: maskSession(updatedUser.telegramSession || process.env.TELEGRAM_SESSION),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
