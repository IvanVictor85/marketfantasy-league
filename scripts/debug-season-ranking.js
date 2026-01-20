const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSeasonRanking() {
  console.log('🔍 Debug: Ranking da Temporada\n');

  try {
    // 1. Buscar liga e suas competições
    const leagueId = 'cmh3qcrw80000cjvdrwtvt65i';
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        competitions: {
          orderBy: { startDate: 'asc' }
        }
      }
    });

    if (!league) {
      console.log('❌ Liga não encontrada!');
      return;
    }

    console.log('1️⃣ Liga:', league.name);
    console.log('   Competições:', league.competitions.length);

    // 2. Verificar se as competições têm seasonId
    const seasonIds = new Set(league.competitions.map(c => c.seasonId).filter(Boolean));

    if (seasonIds.size === 0) {
      console.log('\n❌ PROBLEMA: Nenhuma competição da liga tem seasonId!');
      console.log('   As competições precisam ter seasonId para o ranking de temporada funcionar.');
      return;
    }

    if (seasonIds.size > 1) {
      console.log('\n⚠️ AVISO: Liga tem competições de múltiplas temporadas!');
      console.log('   Season IDs encontrados:', Array.from(seasonIds));
    }

    // 3. Buscar a temporada (primeira encontrada)
    const seasonId = Array.from(seasonIds)[0];
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        competitions: {
          orderBy: { startDate: 'asc' }
        }
      }
    });

    if (!season) {
      console.log('\n❌ ERRO: Season não encontrada!');
      return;
    }
    console.log('\n2️⃣ Temporada:', season.name);
    console.log('   Status:', season.status);
    console.log('   Prize Pool:', Number(season.prizePool));
    console.log('   Rodadas:', season.competitions.length);

    // 2. Analisar rodadas
    const completedComps = season.competitions.filter(c => c.status === 'COMPLETED');
    const activeComp = season.competitions.find(c => c.status === 'ACTIVE');

    console.log('\n3️⃣ Rodadas:');
    season.competitions.forEach(comp => {
      const statusEmoji = comp.status === 'COMPLETED' ? '✅' : comp.status === 'ACTIVE' ? '🔴' : '⏳';
      console.log(`   ${statusEmoji} ${comp.name} - ${comp.status}`);
    });

    console.log('\n4️⃣ Resumo:');
    console.log(`   Rodadas COMPLETED: ${completedComps.length}`);
    console.log(`   Rodada ACTIVE: ${activeComp ? activeComp.name : 'Nenhuma'}`);

    // 3. Buscar SeasonRanking
    const seasonRankings = await prisma.seasonRanking.findMany({
      where: { seasonId: season.id },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      },
      orderBy: { totalSeasonPoints: 'desc' },
      take: 5
    });

    console.log('\n5️⃣ SeasonRanking (Top 5 - pontos COMPLETED):');
    seasonRankings.forEach((ranking, i) => {
      const username = ranking.user.username || ranking.user.email;
      console.log(`   ${i + 1}º ${username}: ${Number(ranking.totalSeasonPoints).toFixed(2)} pts`);
    });

    // 4. Se tem rodada ACTIVE, buscar pontos parciais
    if (activeComp) {
      console.log(`\n6️⃣ Pontos parciais da ${activeComp.name}:`);

      const activeTeams = await prisma.userTeam.findMany({
        where: { competitionId: activeComp.id },
        include: {
          user: {
            select: { id: true, username: true, email: true }
          }
        },
        orderBy: { totalPoints: 'desc' },
        take: 5
      });

      activeTeams.forEach((team, i) => {
        const username = team.user.username || team.user.email;
        console.log(`   ${i + 1}º ${username}: ${Number(team.totalPoints).toFixed(2)} pts (PARCIAL)`);
      });

      // 5. Combinar pontos (COMPLETED + ACTIVE)
      console.log('\n7️⃣ Ranking COMBINADO (COMPLETED + ACTIVE):');

      const activeScoresMap = new Map();
      activeTeams.forEach(team => {
        activeScoresMap.set(team.userId, Number(team.totalPoints));
      });

      const combinedRankings = seasonRankings.map(ranking => {
        const completedPts = Number(ranking.totalSeasonPoints);
        const activePts = activeScoresMap.get(ranking.userId) || 0;
        const totalPts = completedPts + activePts;

        return {
          username: ranking.user.username || ranking.user.email,
          completedPts,
          activePts,
          totalPts
        };
      });

      // Ordenar por total
      combinedRankings.sort((a, b) => b.totalPts - a.totalPts);

      combinedRankings.forEach((r, i) => {
        console.log(`   ${i + 1}º ${r.username}:`);
        console.log(`      COMPLETED: ${r.completedPts.toFixed(2)} pts`);
        console.log(`      ACTIVE: ${r.activePts.toFixed(2)} pts`);
        console.log(`      TOTAL: ${r.totalPts.toFixed(2)} pts`);
      });
    }

    // 6. Testar chamada da API
    console.log('\n8️⃣ Testando lógica da API /api/season/ranking:');
    const apiUrl = `/api/season/ranking?seasonId=${season.id}`;
    console.log(`   URL: ${apiUrl}`);
    console.log('   ✅ Esta é a URL que o frontend deve chamar');

    console.log('\n✅ DEBUG COMPLETO!');
    console.log('\n📋 VERIFICAR NO FRONTEND:');
    console.log('   1. Quando "Temporada" é selecionada, a página está chamando:');
    console.log(`      GET /api/season/ranking?seasonId=${season.id}`);
    console.log('   2. O hook useRanking deve detectar selectedCompetitionId === "SEASON"');
    console.log('   3. E fazer o fetch para /api/season/ranking ao invés de /api/teams');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugSeasonRanking();
