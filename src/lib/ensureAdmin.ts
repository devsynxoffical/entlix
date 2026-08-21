import bcrypt from 'bcryptjs';
import prisma from './db';

/**
 * Ensures a single admin user exists from env.
 * Set ADMIN_EMAIL + ADMIN_PASSWORD on Railway (and locally).
 */
export async function ensureAdminUser() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.warn(
      '⚠️ ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin bootstrap. Set them to create the admin login.'
    );
    return null;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const hashed = await bcrypt.hash(password, 10);

  if (existing) {
    // Keep password in sync if ADMIN_PASSWORD is provided (useful after deploy)
    if (!existing.password || process.env.ADMIN_RESET_PASSWORD === 'true') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { password: hashed, name: existing.name || name },
      });
      console.log(`✅ Admin password updated for ${email}`);
    } else {
      console.log(`✅ Admin already exists: ${email}`);
    }
    return existing;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      emailAlerts: true,
    },
  });

  console.log(`✅ Admin account created: ${email}`);
  return user;
}
