const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRound4Points() {
  try {
    console.log('🔍 Verificando pontuação da Rodada 4...\n');

    const userId = 'cmhslwje00001115muuomzd9c';

    // Buscar todas as competições do usuário para encontrar a Rodada 4
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

    console.log(`📊 Times encontrados: ${userTeams.length}\n`);

    // Encontrar Rodada 4
    const round4 = userTeams.find(ut =>
      ut.competition?.name?.includes('Rodada 4') ||
      ut.competition?.name?.includes('Round 4')
    );

    if (!round4) {
      console.log('❌ Rodada 4 não encontrada!');
      console.log('\nCompetições disponíveis:');
      userTeams.forEach((ut, i) => {
        console.log(`${i + 1}. ${ut.competition?.name || 'Sem nome'} (${ut.competitionId})`);
      });
      return;
    }

    console.log(`✅ Rodada 4 encontrada: ${round4.competition?.name}`);
    console.log(`   Competition ID: ${round4.competitionId}`);
    console.log(`   Status: ${round4.competition?.status}`);
    console.log(`   Período: ${round4.competition?.startDate} até ${round4.competition?.endDate}`);
    console.log(`   Pontuação Total: ${round4.totalScore || round4.liveScore || 0} pontos`);
    console.log(`   Ranking: ${round4.ranking || 'N/A'}`);
    console.log(`\n📋 Tokens da escalação:\n`);

    // Buscar tokens da competição
    const tokens = await prisma.competitionToken.findMany({
      where: {
        competitionId: round4.competitionId,
        symbol: { in: round4.players }
      },
      orderBy: {
        percentChange: 'desc'
      }
    });

    if (tokens.length === 0) {
      console.log('⚠️ Nenhum token encontrado para esta rodada!');
      console.log(`   Players no UserTeam: ${JSON.stringify(round4.players)}`);
      return;
    }

    let totalPoints = 0;

    tokens.forEach((token, index) => {
      // Points = percentChange (variação percentual)
      const points = parseFloat(token.percentChange?.toString() || '0');
      totalPoints += points;

      const priceStart = parseFloat(token.priceStart?.toString() || '0');
      const priceEnd = parseFloat(token.priceEnd?.toString() || '0');

      console.log(`${index + 1}. ${token.symbol.padEnd(10)} | ${points.toFixed(2).padStart(8)} pts`);
      console.log(`   Nome: ${token.name}`);
      console.log(`   Preço Inicial: $${priceStart > 0 ? priceStart.toFixed(6) : 'N/A'}`);
      console.log(`   Preço Final: $${priceEnd > 0 ? priceEnd.toFixed(6) : 'N/A'}`);
      console.log(`   Var %: ${points >= 0 ? '+' : ''}${points.toFixed(2)}%\n`);
    });

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   TOTAL CALCULADO: ${totalPoints.toFixed(2)} pontos`);
    console.log(`   TOTAL NO BANCO:  ${round4.totalScore || round4.liveScore || 0} pontos`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Verificar discrepância
    const dbPoints = round4.totalScore || round4.liveScore || 0;
    const diff = Math.abs(totalPoints - dbPoints);

    if (diff > 0.01) {
      console.log(`⚠️  ATENÇÃO: Diferença de ${diff.toFixed(2)} pontos detectada!`);
    } else {
      console.log(`✅ Pontuação conferida e está correta!`);
    }

    // Estatísticas
    const bestToken = tokens.reduce((best, curr) =>
      parseFloat(curr.percentChange?.toString() || '0') > parseFloat(best.percentChange?.toString() || '0') ? curr : best
    , tokens[0]);

    const worstToken = tokens.reduce((worst, curr) =>
      parseFloat(curr.percentChange?.toString() || '0') < parseFloat(worst.percentChange?.toString() || '0') ? curr : worst
    , tokens[0]);

    console.log(`\n📊 Estatísticas:`);
    console.log(`   Melhor token: ${bestToken.symbol} com ${parseFloat(bestToken.percentChange?.toString() || '0').toFixed(2)} pts`);
    console.log(`   Pior token: ${worstToken.symbol} com ${parseFloat(worstToken.percentChange?.toString() || '0').toFixed(2)} pts`);
    console.log(`   Média por token: ${(totalPoints / tokens.length).toFixed(2)} pts`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkRound4Points();
