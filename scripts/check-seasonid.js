const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const comps = await prisma.competition.findMany({
    where: { leagueId: 'main-league' },
    select: {
      id: true,
      name: true,
      status: true,
      seasonId: true
    },
    orderBy: { startDate: 'desc' },
    take: 5
  });

  console.log('\nCompetitions com seasonId:\n');
  comps.forEach(c => {
    console.log(`  ${c.name}: seasonId = ${c.seasonId || 'NULL'}`);
  });

  await prisma.$disconnect();
}

check();
