const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSeasonRankingAPI() {
  console.log('🧪 Testando API /api/season/ranking com live scoring...\n');

  try {
    // 1. Buscar seasonId da liga
    const leagueId = 'cmh3qcrw80000cjvdrwtvt65i';
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: { competitions: true }
    });

    const seasonIds = new Set(league.competitions.map(c => c.seasonId).filter(Boolean));
    const seasonId = Array.from(seasonIds)[0];

    console.log('📊 Season ID:', seasonId);
    console.log(`🌐 URL da API: http://localhost:3000/api/season/ranking?seasonId=${seasonId}\n`);

    // 2. Fazer a chamada HTTP real à API
    console.log('🔄 Fazendo requisição à API...');

    const response = await fetch(`http://localhost:3000/api/season/ranking?seasonId=${seasonId}`);

    if (!response.ok) {
      console.error(`❌ Erro na API: ${response.status} ${response.statusText}`);
      const errorData = await response.json();
      console.error('Detalhes:', errorData);
      return;
    }

    const data = await response.json();

    console.log('\n✅ Resposta da API recebida com sucesso!\n');

    // 3. Analisar os dados
    console.log('📋 TEMPORADA:');
    console.log(`   Nome: ${data.season.name}`);
    console.log(`   Status: ${data.season.status}`);
    console.log(`   Prize Pool: ${data.season.prizePool} SOL`);
    console.log(`   Rodadas: ${data.season.totalRounds} (${data.season.completedRounds} completas)`);

    if (data.season.activeRound) {
      console.log(`   Rodada Ativa: ${data.season.activeRound.name}`);
    }

    console.log('\n🏆 TOP 5 RANKING:');
    data.rankings.slice(0, 5).forEach((r, i) => {
      console.log(`   ${i + 1}º ${r.username}`);
      console.log(`      Pontos COMPLETED: ${r.completedPoints.toFixed(2)}`);
      console.log(`      Pontos ACTIVE: ${r.activePoints.toFixed(2)} ← Deve ser > 0 se calculou live!`);
      console.log(`      TOTAL: ${r.totalPoints.toFixed(2)}`);
      if (r.estimatedPrize) {
        console.log(`      Prêmio Estimado: ${r.estimatedPrize.toFixed(4)} SOL`);
      }
    });

    // 4. Verificar se ACTIVE points estão calculados
    const hasActivePoints = data.rankings.some(r => r.activePoints > 0);

    console.log('\n📊 DIAGNÓSTICO:');
    if (hasActivePoints) {
      console.log('   ✅ Live scoring está FUNCIONANDO!');
      console.log('   ✅ Rodada ACTIVE sendo considerada no ranking da temporada');
    } else {
      console.log('   ⚠️ Live scoring NÃO está sendo calculado');
      console.log('   ⚠️ Verifique se a Rodada 4 tem CompetitionTokens com priceStart');
    }

    // 5. Verificar userBreakdown se houver
    if (data.userBreakdown) {
      console.log('\n👤 USER BREAKDOWN (Meu Desempenho):');
      console.log(`   Total Completed: ${data.userBreakdown.totalCompletedPoints.toFixed(2)}`);
      console.log(`   Total Active: ${data.userBreakdown.totalActivePoints.toFixed(2)}`);
      console.log(`   Total Geral: ${data.userBreakdown.totalPoints.toFixed(2)}`);
      console.log(`   Rank: ${data.userBreakdown.currentRank}º`);

      console.log('\n   Rodadas:');
      data.userBreakdown.rounds.forEach(round => {
        const statusEmoji = round.competitionStatus === 'COMPLETED' ? '✅' : round.competitionStatus === 'ACTIVE' ? '🔴' : '⏳';
        console.log(`   ${statusEmoji} ${round.competitionName}: ${round.points.toFixed(2)} pts`);
      });
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSeasonRankingAPI();
