const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLeagueInfo() {
  try {
    console.log('📋 Verificando informações da liga e competições...\n');

    // Get the first active competition
    const activeCompetition = await prisma.competition.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        league: true,
        season: true,
        _count: {
          select: {
            userTeams: true,
            competitionTokens: true
          }
        }
      }
    });

    if (activeCompetition) {
      console.log('🎯 Competição Ativa:');
      console.log(`   ID: ${activeCompetition.id}`);
      console.log(`   Nome: ${activeCompetition.name}`);
      console.log(`   Status: ${activeCompetition.status}`);
      console.log(`   Início: ${activeCompetition.startDate}`);
      console.log(`   Fim: ${activeCompetition.endDate}`);
      console.log(`   Prize Pool: ${activeCompetition.prizePool} SOL`);
      console.log(`   Times: ${activeCompetition._count.userTeams}`);
      console.log(`   Tokens: ${activeCompetition._count.competitionTokens}\n`);

      if (activeCompetition.league) {
        console.log('🏆 Liga Associada:');
        console.log(`   ID: ${activeCompetition.league.id}`);
        console.log(`   Nome: ${activeCompetition.league.name}`);
        console.log(`   Entry Fee: ${activeCompetition.league.entryFee} SOL`);
        console.log(`   Treasury Wallet: ${activeCompetition.league.treasuryWallet || 'Não configurado'}\n`);
      }

      if (activeCompetition.season) {
        console.log('📅 Temporada:');
        console.log(`   ID: ${activeCompetition.season.id}`);
        console.log(`   Nome: ${activeCompetition.season.name}`);
        console.log(`   Prize Pool: ${activeCompetition.season.prizePool} SOL\n`);
      }

      // Show league entries count for active competition
      const activeCompEntries = await prisma.leagueEntry.count({
        where: {
          competitionId: activeCompetition.id,
          status: 'CONFIRMED'
        }
      });
      console.log(`💳 Pagamentos Confirmados (Rodada Ativa): ${activeCompEntries}\n`);
    } else {
      console.log('⚠️ Nenhuma competição ativa encontrada\n');
    }

    // Check upcoming competitions
    const upcomingCompetitions = await prisma.competition.findMany({
      where: { status: 'UPCOMING' },
      include: {
        league: true,
        _count: {
          select: {
            userTeams: true
          }
        }
      },
      take: 3,
      orderBy: { startDate: 'asc' }
    });

    if (upcomingCompetitions.length > 0) {
      console.log('📅 Próximas Competições:');
      for (const [index, comp] of upcomingCompetitions.entries()) {
        const entryCount = await prisma.leagueEntry.count({
          where: {
            competitionId: comp.id,
            status: 'CONFIRMED'
          }
        });
        console.log(`\n${index + 1}. ${comp.name} (${comp.id})`);
        console.log(`   Entry Fee: ${comp.league?.entryFee || 'N/A'} SOL`);
        console.log(`   Início: ${comp.startDate}`);
        console.log(`   Times: ${comp._count.userTeams}`);
        console.log(`   Pagamentos: ${entryCount}`);
      }
    }

    console.log('\n✅ Verificação concluída');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeagueInfo();
