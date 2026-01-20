const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const league = await prisma.league.findUnique({
    where: { id: 'cmh3qcrw80000cjvdrwtvt65i' }
  });
  console.log('Entry Fee:', league.entryFee, 'SOL');
  await prisma.$disconnect();
}

main();
