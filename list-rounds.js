const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const comps = await prisma.competition.findMany({
    where: { leagueId: 'cmh3qcrw80000cjvdrwtvt65i' },
    orderBy: { startDate: 'asc' }
  });
  
  console.log('\nRodadas:');
  comps.forEach((c, i) => {
    console.log(`${i+1}. ${c.name} (${c.status}) - ID: ${c.id}`);
  });
  
  await prisma.$disconnect();
}

main();
