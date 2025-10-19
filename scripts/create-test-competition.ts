import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestCompetition() {
  // Buscar a liga principal
  const mainLeague = await prisma.league.findFirst({
    where: { leagueType: 'MAIN' }
  });

  if (!mainLeague) {
    console.log('❌ Liga principal não encontrada');
    return;
  }

  // Criar competição de teste
  const startTime = new Date();
  const endTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

  const competition = await prisma.competition.create({
    data: {
      leagueId: mainLeague.id,
      startTime,
      endTime,
      status: 'pending',
      prizePool: mainLeague.totalPrizePool,
      distributed: false
    }
  });

  console.log('✅ Competição criada:', competition);
  console.log('🆔 ID:', competition.id);
  console.log('⏰ Início:', competition.startTime);
  console.log('🏁 Fim:', competition.endTime);
}

createTestCompetition()
  .then(() => prisma.$disconnect())
  .catch(console.error);
