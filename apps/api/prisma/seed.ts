import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Create Super Admin ─────────────────────────────────
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@katha.ai' },
    update: { passwordHash, role: 'SUPER_ADMIN' },
    create: {
      email: 'admin@katha.ai',
      name: 'Katha Admin',
      passwordHash,
      role: 'SUPER_ADMIN',
      authProvider: 'EMAIL',
      emailVerified: true,
      preferredLanguage: 'en',
    },
  });

  console.log(`Created admin user: ${adminUser.email} (password: ${adminPassword})`);

  // ── Default Avatars ────────────────────────────────────
  const defaultAvatars = [
    { name: 'Dadi (Grandmother)', description: 'A warm, wise grandmother who tells folk tales', isPublic: true },
    { name: 'Guru Ji', description: 'A learned teacher who shares wisdom stories', isPublic: true },
    { name: 'Mowgli', description: 'An adventurous child exploring the jungle', isPublic: true },
    { name: 'Rani', description: 'A brave queen from historical legends', isPublic: true },
  ];

  for (const avatar of defaultAvatars) {
    await prisma.avatar.upsert({
      where: { id: avatar.name.toLowerCase().replace(/[^a-z]/g, '-') },
      update: {},
      create: {
        ...avatar,
        userId: adminUser.id,
      },
    });
  }

  console.log(`Seeded ${defaultAvatars.length} default avatars`);

  // ── Default Feature Flags ──────────────────────────────
  const defaultFlags = [
    { key: 'story_generation', description: 'Enable AI story generation', enabled: true, isKillSwitch: false },
    { key: 'voice_pipeline', description: 'Enable voice synthesis/recognition', enabled: true, isKillSwitch: false },
    { key: 'subscriptions', description: 'Enable subscription purchases', enabled: true, isKillSwitch: false },
    { key: 'social_login', description: 'Enable Google/Apple sign-in', enabled: false, isKillSwitch: false },
    { key: 'maintenance_mode', description: 'Kill switch: put app in maintenance mode', enabled: false, isKillSwitch: true },
  ];

  for (const flag of defaultFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }

  console.log(`Seeded ${defaultFlags.length} feature flags`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
