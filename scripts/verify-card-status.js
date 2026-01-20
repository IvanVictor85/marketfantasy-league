const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCardStatus() {
  try {
    console.log('🔍 Verificando status para o MainLeagueCard...\n');

    // Buscar liga principal
    const league = await prisma.league.findFirst({
      where: { name: 'Liga Principal MarketFantasy' }
    });

    // Buscar competição ativa
    const activeCompetition = await prisma.competition.findFirst({
      where: {
        leagueId: league.id,
        status: 'ACTIVE'
      },
      include: {
        season: {
          select: {
            id: true,
            name: true,
            prizePool: true,
            status: true
          }
        },
        _count: {
          select: {
            userTeams: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    if (!activeCompetition) {
      console.log('❌ Nenhuma competição ACTIVE encontrada');
      return;
    }

    console.log('📋 Competição Ativa:', activeCompetition.name);
    console.log('📊 Status:', activeCompetition.status);
    console.log('📅 Início:', activeCompetition.startDate.toLocaleString('pt-BR'));
    console.log('📅 Fim:', activeCompetition.endDate.toLocaleString('pt-BR'));
    console.log('👥 Times:', activeCompetition._count.userTeams);
    console.log('');

    // Buscar todas as competições da temporada
    if (activeCompetition.season) {
      const seasonCompetitions = await prisma.competition.findMany({
        where: {
          seasonId: activeCompetition.season.id,
          leagueId: league.id
        },
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          name: true,
          status: true
        }
      });

      const totalRounds = seasonCompetitions.length;
      const completedRounds = seasonCompetitions.filter(c => c.status === 'COMPLETED').length;
      const currentRoundIndex = seasonCompetitions.findIndex(c => c.id === activeCompetition.id);
      const currentRoundNumber = currentRoundIndex !== -1 ? currentRoundIndex + 1 : null;

      console.log('🏆 Temporada:', activeCompetition.season.name);
      console.log('📊 Status Temporada:', activeCompetition.season.status);
      console.log('📋 Rodadas:', `${currentRoundNumber} / ${totalRounds}`);
      console.log('✅ Completadas:', completedRounds);
      console.log('💰 Prêmio Total:', activeCompetition.season.prizePool.toString(), 'SOL');
      console.log('');

      console.log('📊 DADOS PARA O CARD:');
      console.log('═══════════════════════════════════════');
      console.log(`status: "${activeCompetition.status}"`);
      console.log(`startDate: "${activeCompetition.startDate.toISOString()}"`);
      console.log(`endDate: "${activeCompetition.endDate.toISOString()}"`);
      console.log('');
      console.log('season: {');
      console.log(`  name: "${activeCompetition.season.name}",`);
      console.log(`  status: "${activeCompetition.season.status}",`);
      console.log(`  totalRounds: ${totalRounds},`);
      console.log(`  completedRounds: ${completedRounds},`);
      console.log(`  currentRoundNumber: ${currentRoundNumber}`);
      console.log('}');
      console.log('═══════════════════════════════════════\n');

      const now = new Date();
      console.log('⏰ Data/Hora Atual:', now.toLocaleString('pt-BR'));
      console.log('');

      // Simular a lógica do getCompetitionState
      console.log('🎯 LÓGICA DO CARD:');
      console.log('─────────────────────────────────────');

      if (activeCompetition.status === 'COMPLETED') {
        console.log('❌ Status: COMPLETED → Botão: "Liga Finalizada"');
      } else if (activeCompetition.status === 'ACTIVE') {
        console.log('✅ Status: ACTIVE → Botão: "Entrar na Rodada (0.025 SOL)"');
        console.log('   (MODO TESTE: Permite entrada independente das datas)');
      } else {
        console.log('⏳ Status: PENDING → Botão: "Entrar na Rodada (0.025 SOL)"');
      }

      console.log('─────────────────────────────────────\n');

      if (activeCompetition.season.status === 'ACTIVE') {
        console.log('✅ Badge da Temporada: "🔴 Ativa"');
      } else {
        console.log('⚠️ Badge da Temporada: "✅ Finalizada"');
        console.log('   (Isso pode estar confundindo - vou atualizar se necessário)');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCardStatus();
