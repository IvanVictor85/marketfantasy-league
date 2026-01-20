const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 📸 SNAPSHOT INICIAL - DOMINGO 21H BR
 *
 * Este script deve ser executado no início da rodada (Domingo 21h BR)
 * Ele grava o priceStart de todos os tokens para referência de pontuação
 */

async function snapshotInitial() {
  console.log('📸 SNAPSHOT INICIAL - CAPTURANDO PREÇOS DE ABERTURA\n');
  console.log('='.repeat(80));

  try {
    // 1️⃣ BUSCAR COMPETIÇÃO PENDING (PRONTA PARA INICIAR)
    console.log('\n1️⃣ Buscando competição pronta para iniciar...');

    const activeCompetition = await prisma.competition.findFirst({
      where: { status: 'PENDING' },
      include: {
        league: true,
        userTeams: true
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    if (!activeCompetition) {
      console.log('❌ Nenhuma competição PENDING encontrada!');
      console.log('   Use PENDING para rodadas que ainda não começaram.');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Competição: ${activeCompetition.name || activeCompetition.id}`);
    console.log(`   Liga: ${activeCompetition.league.name}`);
    console.log(`   Times registrados: ${activeCompetition.userTeams.length}`);

    // 2️⃣ COLETAR TODOS OS TOKENS DOS TIMES
    console.log('\n2️⃣ Coletando tokens dos times...');

    const allTokenSymbols = new Set();

    activeCompetition.userTeams.forEach(team => {
      const tokens = Array.isArray(team.players) ? team.players : [];
      tokens.forEach(symbol => allTokenSymbols.add(symbol.toUpperCase()));
    });

    const uniqueTokens = Array.from(allTokenSymbols);
    console.log(`   ✅ ${uniqueTokens.length} tokens únicos encontrados:`);
    console.log(`   ${uniqueTokens.join(', ')}`);

    // 3️⃣ BUSCAR PREÇOS DO COINGECKO
    console.log('\n3️⃣ Buscando preços do CoinGecko...');

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
      'POL': 'matic-network',  // ← NOVO: Polygon migrou de MATIC para POL
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

    const coingeckoIds = uniqueTokens.map(symbol => tokenMapping[symbol]).filter(Boolean);

    console.log(`   Buscando preços para ${coingeckoIds.length} tokens...`);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const priceData = await response.json();
    console.log(`   ✅ Preços obtidos com sucesso`);

    // 4️⃣ SALVAR SNAPSHOT INICIAL
    console.log('\n4️⃣ Salvando snapshot inicial (priceStart)...\n');

    const snapshotDate = new Date();
    let savedCount = 0;

    for (const symbol of uniqueTokens) {
      const coingeckoId = tokenMapping[symbol];

      if (!coingeckoId || !priceData[coingeckoId]) {
        console.log(`   ⚠️  ${symbol} - Token não encontrado no CoinGecko`);
        continue;
      }

      const tokenData = priceData[coingeckoId];

      if (!tokenData || !tokenData.usd) {
        console.log(`   ⚠️  ${symbol} - Preço não disponível no CoinGecko`);
        continue;
      }

      const price = tokenData.usd;

      // Buscar token no catálogo
      let token = await prisma.token.findFirst({
        where: { symbol: symbol }
      });

      // Se não existir, criar
      if (!token) {
        token = await prisma.token.create({
          data: {
            symbol: symbol,
            name: symbol,
            coingeckoId: coingeckoId,
            isActive: true
          }
        });
        console.log(`   📝 ${symbol} - Token criado no catálogo`);
      }

      // Criar ou atualizar CompetitionToken
      const existingCompToken = await prisma.competitionToken.findUnique({
        where: {
          competitionId_tokenId: {
            competitionId: activeCompetition.id,
            tokenId: coingeckoId
          }
        }
      });

      if (existingCompToken) {
        // Atualizar
        await prisma.competitionToken.update({
          where: { id: existingCompToken.id },
          data: {
            priceStart: price,
            priceStartDate: snapshotDate
          }
        });

        console.log(`   ✅ ${symbol} - Preço inicial salvo: $${price.toFixed(2)}`);
      } else {
        // Criar novo
        await prisma.competitionToken.create({
          data: {
            competitionId: activeCompetition.id,
            tokenId: coingeckoId,
            symbol: symbol,
            name: tokenData.name || symbol,
            imageUrl: '',
            priceStart: price,
            priceStartDate: snapshotDate
          }
        });

        console.log(`   ✅ ${symbol} - Token e preço inicial criados: $${price.toFixed(2)}`);
      }

      savedCount++;
    }

    // 5️⃣ ATIVAR COMPETIÇÃO
    console.log('\n5️⃣ Ativando competição...');

    await prisma.competition.update({
      where: { id: activeCompetition.id },
      data: { status: 'ACTIVE' }
    });

    console.log('   ✅ Status: PENDING → ACTIVE');
    console.log('   🔒 Edição de times agora está BLOQUEADA');

    // 6️⃣ RESUMO
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DO SNAPSHOT INICIAL:');
    console.log('='.repeat(80));
    console.log(`Data/Hora: ${snapshotDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`Tokens processados: ${savedCount}/${uniqueTokens.length}`);
    console.log(`Competição: ${activeCompetition.name}`);
    console.log('\n✅ SNAPSHOT INICIAL CONCLUÍDO!');
    console.log('   Os preços de abertura foram gravados.');
    console.log('   Aguardando snapshot final (Sexta 21h BR) para cálculo de pontuação.');
    console.log('='.repeat(80));

    await prisma.$disconnect();

  } catch (error) {
    console.error('\n❌ ERRO:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Executar script
snapshotInitial();
