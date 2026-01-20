const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDates() {
  const competitions = await prisma.competition.findMany({
    where: {
      leagueId: 'cmh3qcrw80000cjvdrwtvt65i',
      name: { in: ['Rodada 1', 'Rodada 2', 'Rodada 3', 'Rodada 4'] }
    },
    orderBy: { startDate: 'asc' }
  });

  console.log('📅 Datas das Rodadas:\n');

  competitions.forEach(comp => {
    const start = new Date(comp.startDate);
    const end = new Date(comp.endDate);

    console.log(`${comp.name}:`);
    console.log(`  Start UTC: ${start.toISOString()}`);
    console.log(`  End UTC: ${end.toISOString()}`);
    console.log(`  Status: ${comp.status}\n`);
  });

  await prisma.$disconnect();
}

checkDates().catch(console.error);
