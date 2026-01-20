const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTeamsAPI() {
  console.log('🧪 TESTANDO CÁLCULO DE LIVE SCORE\n');
  console.log('='.repeat(80));

  try {
    // Buscar competição ACTIVE
    const activeCompetition = await prisma.competition.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!activeCompetition) {
      console.log('❌ Nenhuma competição ACTIVE encontrada!');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Competição: ${activeCompetition.name}`);
    console.log(`   ID: ${activeCompetition.id}`);

    // Buscar times
    const userTeams = await prisma.userTeam.findMany({
      where: { competitionId: activeCompetition.id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      take: 3 // Apenas 3 primeiros para teste
    });

    console.log(`\n📊 Testando cálculo para ${userTeams.length} times...\n`);

    // Mapeamento de tokens
    const TOKEN_MAPPING = {
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
      'POL': 'matic-network',
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
      'ZEC': 'zcash',
      'HYPE': 'hyperliquid',
      'DASH': 'dash',
      'ASTER': 'aster-2'
    };

    // 1. Buscar priceStart
    const competitionTokens = await prisma.competitionToken.findMany({
      where: { competitionId: activeCompetition.id },
      select: {
        symbol: true,
        tokenId: true,
        priceStart: true
      }
    });

    const priceStartMap = new Map();
    competitionTokens.forEach(ct => {
      priceStartMap.set(ct.symbol.toUpperCase(), parseFloat(ct.priceStart?.toString() || '0'));
    });

    console.log(`📊 Preços iniciais: ${competitionTokens.length} tokens`);

    // 2. Buscar preços atuais
    const allTokenSymbols = new Set();
    userTeams.forEach(team => {
      const tokens = team.players;
      tokens.forEach(symbol => allTokenSymbols.add(symbol.toUpperCase()));
    });

    const tokenIds = Array.from(allTokenSymbols)
      .map(symbol => TOKEN_MAPPING[symbol])
      .filter(Boolean);

    console.log(`🌐 Buscando preços de ${tokenIds.length} tokens no CoinGecko...`);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`
    );

    if (!response.ok) {
      console.error(`❌ Erro ao buscar preços: ${response.statusText}`);
      await prisma.$disconnect();
      return;
    }

    const currentPrices = await response.json();
    console.log(`✅ Preços atuais obtidos\n`);

    // 3. Criar mapa de preços atuais
    const currentPriceMap = new Map();
    Object.entries(TOKEN_MAPPING).forEach(([symbol, coingeckoId]) => {
      if (currentPrices[coingeckoId]?.usd) {
        currentPriceMap.set(symbol, currentPrices[coingeckoId].usd);
      }
    });

    // 4. Calcular pontuação para cada time
    userTeams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.teamName} (${team.user.name})`);

      const tokens = team.players;
      let totalScore = 0;

      tokens.forEach((symbol) => {
        const symbolUpper = symbol.toUpperCase();
        const priceStart = priceStartMap.get(symbolUpper);
        const currentPrice = currentPriceMap.get(symbolUpper);

        if (priceStart && currentPrice && priceStart > 0) {
          const percentChange = ((currentPrice - priceStart) / priceStart) * 100;
          totalScore += percentChange;

          const arrow = percentChange >= 0 ? '📈' : '📉';
          console.log(`   ${arrow} ${symbolUpper}: $${priceStart.toFixed(2)} → $${currentPrice.toFixed(2)} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%)`);
        } else {
          console.log(`   ⚠️  ${symbolUpper}: Preço não disponível`);
          console.log(`      priceStart: ${priceStart}, currentPrice: ${currentPrice}`);
        }
      });

      console.log(`   📊 TOTAL: ${totalScore >= 0 ? '+' : ''}${totalScore.toFixed(2)} pontos\n`);
    });

    console.log('='.repeat(80));
    console.log('✅ TESTE CONCLUÍDO');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERRO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTeamsAPI();
