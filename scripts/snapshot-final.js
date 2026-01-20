const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { distributeRoundPrizes, distributeSeasonPrizes } = require('./distribute-prizes');

/**
 * 📸 SNAPSHOT FINAL - SEXTA 21H BR
 *
 * Este script deve ser executado no fim da rodada (Sexta 21h BR)
 * Ele:
 * 1. Grava o priceEnd de todos os tokens
 * 2. Calcula percentChange = ((priceEnd - priceStart) / priceStart) * 100
 * 3. Calcula a pontuação de cada time (soma dos percentChange dos tokens)
 * 4. Atualiza totalPoints de cada UserTeam
 */

async function snapshotFinal() {
  console.log('📸 SNAPSHOT FINAL - ENCERRANDO RODADA E CALCULANDO PONTUAÇÃO\n');
  console.log('='.repeat(80));

  try {
    // 1️⃣ BUSCAR COMPETIÇÃO ATIVA
    console.log('\n1️⃣ Buscando competição ativa...');

    const activeCompetition = await prisma.competition.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        league: true,
        season: true, // ← NOVO: Incluir dados da temporada
        userTeams: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        competitionTokens: true
      }
    });

    if (!activeCompetition) {
      console.log('❌ Nenhuma competição ativa encontrada!');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Competição: ${activeCompetition.name || activeCompetition.id}`);
    console.log(`   Liga: ${activeCompetition.league.name}`);
    console.log(`   Times registrados: ${activeCompetition.userTeams.length}`);

    // 2️⃣ BUSCAR PREÇOS ATUAIS DO COINGECKO
    console.log('\n2️⃣ Buscando preços finais do CoinGecko...');

    const tokenMapping = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'XRP': 'ripple',
      'DOGE': 'dogecoin',
      'ADA': 'cardano',
      'AVAX': 'avalanche-2',
      'SHIB': 'shiba-inu',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AAVE': 'aave',
      'MATIC': 'matic-network',
      'POL': 'matic-network',  // ← Polygon migrou de MATIC para POL
      'ATOM': 'cosmos',
      'FTM': 'fantom',
      'NEAR': 'near',
      'ALGO': 'algorand',
      'VET': 'vechain',
      'ICP': 'internet-computer',
      'APT': 'aptos',
      'OP': 'optimism',
      'ARB': 'arbitrum',
      'LDO': 'lido-dao',
      'GRT': 'the-graph',
      'MKR': 'maker',
      'SNX': 'havven',
      'RUNE': 'thorchain',
      'INJ': 'injective-protocol',
      'FTM': 'fantom',
      'ZEC': 'zcash',
      'HYPE': 'hyperliquid',
      'DASH': 'dash',
      'ASTER': 'aster-2'
    };

    const coingeckoIds = activeCompetition.competitionTokens.map(ct => ct.tokenId);

    console.log(`   Buscando preços para ${coingeckoIds.length} tokens...`);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const priceData = await response.json();
    console.log(`   ✅ Preços finais obtidos com sucesso`);

    // 3️⃣ ATUALIZAR PREÇOS FINAIS E CALCULAR VARIAÇÃO
    console.log('\n3️⃣ Calculando variações de preço...\n');

    const snapshotDate = new Date();
    const tokenPerformance = {}; // symbol -> percentChange

    for (const compToken of activeCompetition.competitionTokens) {
      const tokenData = priceData[compToken.tokenId];

      if (!tokenData) {
        console.log(`   ⚠️  ${compToken.symbol} - Preço final não disponível`);
        continue;
      }

      const priceEnd = tokenData.usd;
      const priceStart = parseFloat(compToken.priceStart || 0);

      if (priceStart === 0) {
        console.log(`   ⚠️  ${compToken.symbol} - Sem preço inicial registrado (pulando)`);
        continue;
      }

      // Calcular variação percentual
      const percentChange = ((priceEnd - priceStart) / priceStart) * 100;

      // Atualizar no banco
      await prisma.competitionToken.update({
        where: { id: compToken.id },
        data: {
          priceEnd: priceEnd,
          priceEndDate: snapshotDate,
          percentChange: percentChange
        }
      });

      tokenPerformance[compToken.symbol] = percentChange;

      const arrow = percentChange >= 0 ? '📈' : '📉';
      const color = percentChange >= 0 ? '+' : '';

      console.log(`   ${arrow} ${compToken.symbol}: $${priceStart.toFixed(2)} → $${priceEnd.toFixed(2)} (${color}${percentChange.toFixed(2)}%)`);
    }

    // 4️⃣ CALCULAR PONTUAÇÃO DOS TIMES
    console.log('\n4️⃣ Calculando pontuação dos times...\n');

    for (const userTeam of activeCompetition.userTeams) {
      const tokens = Array.isArray(userTeam.players) ? userTeam.players : [];
      let totalPoints = 0;

      console.log(`   🏆 ${userTeam.teamName || 'Sem nome'} (${userTeam.user.name || userTeam.user.email})`);

      tokens.forEach((symbol, index) => {
        const symbolUpper = symbol.toUpperCase();
        const performance = tokenPerformance[symbolUpper];

        if (performance !== undefined) {
          totalPoints += performance;
          const arrow = performance >= 0 ? '📈' : '📉';
          console.log(`      ${index + 1}. ${symbolUpper}: ${performance >= 0 ? '+' : ''}${performance.toFixed(2)}%`);
        } else {
          console.log(`      ${index + 1}. ${symbolUpper}: N/A`);
        }
      });

      // Atualizar pontuação no banco
      await prisma.userTeam.update({
        where: { id: userTeam.id },
        data: { totalPoints: totalPoints }
      });

      console.log(`      📊 Total: ${totalPoints >= 0 ? '+' : ''}${totalPoints.toFixed(2)} pontos\n`);
    }

    // 5️⃣ MARCAR COMPETIÇÃO COMO COMPLETA
    console.log('5️⃣ Finalizando competição...');

    await prisma.competition.update({
      where: { id: activeCompetition.id },
      data: { status: 'COMPLETED' }
    });

    console.log('   ✅ Competição marcada como COMPLETED');

    // 🆕 DISTRIBUIR PRÊMIOS DA RODADA
    await distributeRoundPrizes(activeCompetition.id);

    // 🆕 LIBERAR PRÓXIMA RODADA
    console.log('\n🔓 Liberando próxima rodada...');

    if (activeCompetition.season) {
      // Buscar próxima rodada da mesma temporada
      const nextRound = await prisma.competition.findFirst({
        where: {
          seasonId: activeCompetition.season.id,
          status: 'UPCOMING'
        },
        orderBy: {
          startDate: 'asc'
        }
      });

      if (nextRound) {
        await prisma.competition.update({
          where: { id: nextRound.id },
          data: { status: 'PENDING' }
        });

        console.log(`   ✅ ${nextRound.name} liberada!`);
        console.log(`   🔓 Status: UPCOMING → PENDING`);
        console.log(`   💰 Usuários podem agora pagar e criar times`);
        console.log(`   📅 Início: ${nextRound.startDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        console.log(`   📅 Fim: ${nextRound.endDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      } else {
        console.log('   ℹ️  Não há próxima rodada (fim da temporada)');

        // Verificar se a temporada acabou
        const remainingRounds = await prisma.competition.count({
          where: {
            seasonId: activeCompetition.season.id,
            status: { in: ['PENDING', 'ACTIVE', 'UPCOMING'] }
          }
        });

        if (remainingRounds === 0) {
          console.log('   🏁 TEMPORADA FINALIZADA!');
          console.log(`   🏆 Prêmio acumulado: ${activeCompetition.season.prizePool} SOL`);

          // DISTRIBUIR PRÊMIOS DA TEMPORADA
          await distributeSeasonPrizes(activeCompetition.season.id);
        }
      }
    } else {
      console.log('   ⚠️  Competição não vinculada a uma temporada');
    }

    // 6️⃣ RANKING FINAL
    console.log('\n' + '='.repeat(80));
    console.log('🏆 RANKING FINAL:');
    console.log('='.repeat(80));

    const rankedTeams = activeCompetition.userTeams
      .map(team => ({
        name: team.teamName || 'Sem nome',
        user: team.user.name || team.user.email,
        points: parseFloat(team.totalPoints)
      }))
      .sort((a, b) => b.points - a.points);

    rankedTeams.forEach((team, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`${medal} ${index + 1}º ${team.name} (${team.user}): ${team.points >= 0 ? '+' : ''}${team.points.toFixed(2)} pontos`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ SNAPSHOT FINAL CONCLUÍDO!');
    console.log(`   Data/Hora: ${snapshotDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`   Competição encerrada: ${activeCompetition.name}`);
    console.log('='.repeat(80));

    await prisma.$disconnect();

  } catch (error) {
    console.error('\n❌ ERRO:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Executar script
snapshotFinal();
