const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllRounds() {
  try {
    console.log('🔍 Verificando todas as rodadas...\n');

    const userId = 'cmhslwje00001115muuomzd9c';

    // Buscar todos os times do usuário
    const userTeams = await prisma.userTeam.findMany({
      where: { userId },
      include: {
        competition: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Total de rodadas encontradas: ${userTeams.length}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    userTeams.forEach((ut, index) => {
      console.log(`${index + 1}. ${ut.competition?.name || 'Sem nome'}`);
      console.log(`   Competition ID: ${ut.competitionId}`);
      console.log(`   Status: ${ut.competition?.status || 'N/A'}`);
      console.log(`   Total Score: ${ut.totalScore || 'N/A'}`);
      console.log(`   Live Score: ${ut.liveScore || 'N/A'}`);
      console.log(`   Ranking: ${ut.ranking || 'N/A'}`);
      console.log(`   Players: ${ut.players.length} tokens`);
      console.log(`   Data: ${ut.createdAt}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllRounds();
