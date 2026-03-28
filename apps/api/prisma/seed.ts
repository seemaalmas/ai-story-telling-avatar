import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@katha.ai' },
    update: {},
    create: {
      email: 'admin@katha.ai',
      name: 'Katha Admin',
      role: 'SUPER_ADMIN',
      authProvider: 'EMAIL',
      preferredLanguage: 'en',
    },
  });

  console.log(`Created admin user: ${adminUser.email}`);

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
