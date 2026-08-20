import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

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
        metaAccessToken: ''
      });
    }

    return NextResponse.json({
      defaultRegion: user.defaultRegion || 'Global',
      emailAlerts: user.emailAlerts !== false,
      metaAccessToken: user.metaAccessToken || ''
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { defaultRegion, emailAlerts, metaAccessToken } = body;

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

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        defaultRegion: defaultRegion ?? user.defaultRegion,
        emailAlerts: emailAlerts ?? user.emailAlerts,
        metaAccessToken: metaAccessToken !== undefined ? metaAccessToken : user.metaAccessToken
      }
    });

    return NextResponse.json({
      success: true,
      defaultRegion: updatedUser.defaultRegion,
      emailAlerts: updatedUser.emailAlerts,
      metaAccessToken: updatedUser.metaAccessToken
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
