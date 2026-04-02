// Quick script to promote admin@katha.ai to SUPER_ADMIN
// Run with: node prisma/promote-admin.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { email: 'admin@katha.ai' },
    data: { role: 'SUPER_ADMIN', emailVerified: true },
  });

  if (result.count > 0) {
    console.log('SUCCESS: admin@katha.ai promoted to SUPER_ADMIN');
  } else {
    console.log('ERROR: No user found with email admin@katha.ai');
    console.log('Register first at the admin panel, then re-run this script.');
  }

  // Also verify
  const user = await prisma.user.findUnique({
    where: { email: 'admin@katha.ai' },
    select: { id: true, email: true, name: true, role: true },
  });
  console.log('User details:', user);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
