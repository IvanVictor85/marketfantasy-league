const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestRound() {
  const now = new Date();
  const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Amanhã
  const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 dias depois

  // Buscar a temporada existente através de uma competição da liga
  const existingCompetition = await prisma.competition.findFirst({
    where: {
      leagueId: 'cmh3qcrw80000cjvdrwtvt65i',
      seasonId: { not: null }
    },
    include: { season: true },
    orderBy: { createdAt: 'desc' }
  });

  const existingSeason = existingCompetition?.season;
  console.log('Temporada encontrada:', existingSeason?.name || 'Nenhuma');

  const competition = await prisma.competition.create({
    data: {
      name: 'Rodada Teste Smart Contract',
      leagueId: 'cmh3qcrw80000cjvdrwtvt65i',
      seasonId: existingSeason?.id || null,
      startDate: startDate,
      endDate: endDate,
      status: 'ACTIVE', // Status ativo para permitir entradas
      prizePool: 0
    }
  });

  console.log('\n✅ Nova rodada de teste criada!');
  console.log('   ID:', competition.id);
  console.log('   Nome:', competition.name);
  console.log('   Status:', competition.status);
  console.log('   Início:', competition.startDate);
  console.log('   Fim:', competition.endDate);

  // Verificar se aparece na API agora
  const activeComp = await prisma.competition.findFirst({
    where: {
      leagueId: 'cmh3qcrw80000cjvdrwtvt65i',
      status: 'ACTIVE'
    }
  });

  console.log('\n📡 Competição ACTIVE na liga:', activeComp?.name || 'Nenhuma');

  await prisma.$disconnect();
}

createTestRound().catch(e => {
  console.error('Erro:', e);
  process.exit(1);
});
