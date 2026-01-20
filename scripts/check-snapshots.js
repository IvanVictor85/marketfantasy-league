const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSnapshots() {
  console.log('📊 Status dos Snapshots:\n');

  const competitions = await prisma.competition.findMany({
    where: {
      leagueId: 'cmh3qcrw80000cjvdrwtvt65i',
      name: { in: ['Rodada 1', 'Rodada 2', 'Rodada 3', 'Rodada 4'] }
    },
    select: { id: true, name: true },
    orderBy: { startDate: 'asc' }
  });

  for (const comp of competitions) {
    const tokens = await prisma.competitionToken.findMany({
      where: { competitionId: comp.id }
    });

    const withStart = tokens.filter(t => t.priceStart !== null).length;
    const withEnd = tokens.filter(t => t.priceEnd !== null).length;

    console.log(`${comp.name}:`);
    console.log(`  Total tokens: ${tokens.length}`);
    console.log(`  Com priceStart: ${withStart}`);
    console.log(`  Com priceEnd: ${withEnd}`);
    console.log(`  Status: ${withStart > 0 ? '✅ Snapshot inicial feito' : '⚪ Sem snapshot'}`);
    console.log();
  }

  await prisma.$disconnect();
}

checkSnapshots().catch(console.error);
