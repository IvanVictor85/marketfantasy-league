const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reopenRodada4() {
  try {
    console.log('🔄 Reabrindo Rodada 4 para continuar testes...\n');

    const rodada4Id = 'cmicalux3000810oueqd2dkax';

    // 1. Mudar status de COMPLETED para ACTIVE
    const competition = await prisma.competition.update({
      where: { id: rodada4Id },
      data: {
        status: 'ACTIVE'
      }
    });

    console.log('✅ Rodada 4 reaberta com sucesso!');
    console.log('   Status:', competition.status);
    console.log('   Nome:', competition.name);
    console.log('   Início:', competition.startDate);
    console.log('   Fim:', competition.endDate);

    // 2. Remover prêmios da Rodada 4 (para recalcular quando finalizar de verdade)
    const deletedPrizes = await prisma.prizeClaim.deleteMany({
      where: {
        competitionId: rodada4Id
      }
    });

    console.log(`\n🗑️  Removidos ${deletedPrizes.count} prêmios da Rodada 4 (serão recalculados na finalização real)`);

    // 3. Remover prêmios da temporada (também serão recalculados)
    const deletedSeasonPrizes = await prisma.prizeClaim.deleteMany({
      where: {
        seasonId: 'cmicalu8a000010ouykcpw7b6',
        competitionId: null // Prêmios de temporada não têm competitionId
      }
    });

    console.log(`🗑️  Removidos ${deletedSeasonPrizes.count} prêmios da temporada (serão recalculados quando a temporada terminar de verdade)`);

    // 4. Zerar totalPoints dos UserTeams da Rodada 4 (para recalcular)
    const updatedTeams = await prisma.userTeam.updateMany({
      where: {
        competitionId: rodada4Id
      },
      data: {
        totalPoints: 0
      }
    });

    console.log(`🔄 Zerados totalPoints de ${updatedTeams.count} times da Rodada 4`);

    // 5. Remover priceEnd dos CompetitionTokens (snapshot final)
    const updatedTokens = await prisma.competitionToken.updateMany({
      where: {
        competitionId: rodada4Id
      },
      data: {
        priceEnd: null,
        priceEndDate: null,
        percentChange: null
      }
    });

    console.log(`📊 Removido snapshot final de ${updatedTokens.count} tokens\n`);

    console.log('✅ Rodada 4 está pronta para continuar os testes!');
    console.log('   Quando terminar os testes, execute:');
    console.log('   node scripts/snapshot-final.js cmicalux3000810oueqd2dkax');

  } catch (error) {
    console.error('❌ Erro ao reabrir Rodada 4:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reopenRodada4();
