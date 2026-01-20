const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🧪 SCRIPT DE TESTE DE PONTUAÇÃO
 *
 * Este script simula o cálculo de pontos para testar se o motor de pontuação
 * está funcionando corretamente após a migração para UserTeam.
 */

async function testScoring() {
  console.log('🧪 INICIANDO TESTE DE PONTUAÇÃO\n');
  console.log('='.repeat(60));

  try {
    // 1️⃣ BUSCAR COMPETIÇÃO ACTIVE
    console.log('\n1️⃣ Buscando competição ACTIVE...');

    const activeCompetition = await prisma.competition.findFirst({
      where: {
        status: 'ACTIVE'
      },
      include: {
        league: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    if (!activeCompetition) {
      console.log('❌ Nenhuma competição ACTIVE encontrada!');
      console.log('💡 Dica: Certifique-se de que existe uma competição com status ACTIVE no banco.');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Competição encontrada:`);
    console.log(`   ID: ${activeCompetition.id}`);
    console.log(`   Liga: ${activeCompetition.league.name}`);
    console.log(`   Status: ${activeCompetition.status}`);
    console.log(`   Início: ${activeCompetition.startDate.toISOString()}`);
    console.log(`   Fim: ${activeCompetition.endDate.toISOString()}`);

    // 2️⃣ BUSCAR TIMES DA COMPETIÇÃO (UserTeam)
    console.log('\n2️⃣ Buscando times da competição (UserTeam)...');

    const userTeams = await prisma.userTeam.findMany({
      where: {
        competitionId: activeCompetition.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            publicKey: true
          }
        }
      }
    });

    console.log(`✅ Encontrados ${userTeams.length} times na competição`);

    if (userTeams.length === 0) {
      console.log('\n⚠️ Nenhum time encontrado para esta competição!');
      console.log('💡 Dica: Crie um time para a competição ativa antes de rodar este teste.');
      await prisma.$disconnect();
      return;
    }

    // Exibir resumo dos times
    console.log('\n📋 Times registrados:');
    userTeams.forEach((team, index) => {
      const tokens = team.players; // Array de strings
      console.log(`   ${index + 1}. "${team.teamName}" (${team.user.name})`);
      console.log(`      Tokens: ${tokens.join(', ')}`);
      console.log(`      Pontos atuais: ${team.totalPoints.toString()}`);
    });

    // 3️⃣ SIMULAR CÁLCULO DE PONTUAÇÃO VIA API
    console.log('\n3️⃣ Chamando API de snapshot para calcular pontuações...');
    console.log('   (Simulando chamada POST /api/competition/snapshot)\n');

    const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&price_change_percentage=7d';

    // Buscar dados reais do CoinGecko
    console.log('🌐 Buscando dados do mercado do CoinGecko...');

    let tokenChangeMap = new Map(); // symbol -> change_7d

    try {
      const response = await fetch(COINGECKO_URL, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoFantasy-League/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();

        data.forEach((token) => {
          const symbol = token.symbol.toUpperCase();
          const change7d = token.price_change_percentage_7d_in_currency || 0;
          tokenChangeMap.set(symbol, change7d);
        });

        console.log(`✅ Dados carregados: ${tokenChangeMap.size} tokens do CoinGecko\n`);
      } else {
        console.warn(`⚠️ CoinGecko API não disponível (status ${response.status})`);
        console.log('   Usando valores padrão 0 para todos os tokens.\n');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados do CoinGecko:', error.message);
      console.log('   Continuando com valores padrão 0 para todos os tokens.\n');
    }

    // 4️⃣ CALCULAR PONTUAÇÕES
    console.log('4️⃣ Calculando pontuações dos times...\n');
    console.log('='.repeat(60));

    const results = [];

    for (const userTeam of userTeams) {
      const tokens = userTeam.players; // Array de strings
      let totalTeamPoints = 0;
      const breakdown = [];

      console.log(`\n🎯 Time: "${userTeam.teamName}" (${userTeam.user.name})`);
      console.log('─'.repeat(60));

      tokens.forEach((tokenSymbol, index) => {
        const change7d = tokenChangeMap.get(tokenSymbol.toUpperCase()) || 0;
        totalTeamPoints += change7d;

        const emoji = change7d > 0 ? '📈' : change7d < 0 ? '📉' : '➡️';
        console.log(`   ${emoji} ${index + 1}. ${tokenSymbol.padEnd(8)} → ${change7d > 0 ? '+' : ''}${change7d.toFixed(2)}%`);

        breakdown.push({
          symbol: tokenSymbol,
          change7d
        });
      });

      const totalScore = Math.round(totalTeamPoints * 100) / 100;

      console.log('─'.repeat(60));
      console.log(`   📊 PONTUAÇÃO TOTAL: ${totalScore > 0 ? '+' : ''}${totalScore.toFixed(2)} pontos`);

      results.push({
        teamName: userTeam.teamName,
        userName: userTeam.user.name,
        totalScore,
        breakdown
      });

      // Atualizar no banco
      await prisma.userTeam.update({
        where: { id: userTeam.id },
        data: { totalPoints: totalScore }
      });
    }

    // 5️⃣ RANKING FINAL
    console.log('\n\n5️⃣ RANKING FINAL (Ordenado por pontuação)');
    console.log('='.repeat(60));

    results.sort((a, b) => b.totalScore - a.totalScore);

    results.forEach((result, index) => {
      const position = index + 1;
      const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '  ';
      const score = result.totalScore > 0 ? `+${result.totalScore.toFixed(2)}` : result.totalScore.toFixed(2);

      console.log(`${medal} #${position} - ${result.teamName.padEnd(25)} | ${result.userName.padEnd(20)} | ${score}%`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE DE PONTUAÇÃO CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n📊 Resultados salvos em UserTeam.totalPoints');
    console.log('🔍 Verifique no Prisma Studio ou na página de Ranking\n');

    await prisma.$disconnect();

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Executar teste
testScoring();
