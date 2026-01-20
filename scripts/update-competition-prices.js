const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCompetitionPrices() {
  console.log('💰 Atualizando preços dos tokens no banco de dados...\n');

  try {
    // Buscar competição ativa
    const competition = await prisma.competition.findFirst({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'ACTIVE' }
        ]
      },
      orderBy: {
        startDate: 'desc'
      },
      include: {
        competitionTokens: true
      }
    });

    if (!competition) {
      console.log('❌ Nenhuma competição ativa encontrada');
      await prisma.$disconnect();
      return;
    }

    console.log(`📅 Competição: ${competition.id}`);
    console.log(`🔒 Status: ${competition.status}`);
    console.log(`📊 Tokens a atualizar: ${competition.competitionTokens.length}\n`);

    // Extrair IDs dos tokens
    const tokenIds = competition.competitionTokens.map(t => t.tokenId);

    // Buscar dados frescos do CoinGecko
    console.log('🌐 Buscando dados frescos do CoinGecko...');

    const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('ids', tokenIds.join(','));
    url.searchParams.set('order', 'market_cap_desc');
    url.searchParams.set('per_page', '250');
    url.searchParams.set('page', '1');
    url.searchParams.set('sparkline', 'false');
    url.searchParams.set('price_change_percentage', '1h,24h,7d,30d');

    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log(`❌ CoinGecko retornou erro: ${response.status}`);
      await prisma.$disconnect();
      return;
    }

    const marketData = await response.json();

    if (!marketData || marketData.length === 0) {
      console.log('⚠️ CoinGecko retornou dados vazios');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ CoinGecko retornou ${marketData.length} tokens\n`);

    // Criar mapa de dados por ID
    const dataMap = new Map(marketData.map(token => [token.id, token]));

    // Atualizar cada token no banco
    let updated = 0;
    let skipped = 0;

    for (const competitionToken of competition.competitionTokens) {
      const freshData = dataMap.get(competitionToken.tokenId);

      if (!freshData) {
        console.log(`⚠️  ${competitionToken.symbol}: Sem dados da CoinGecko`);
        skipped++;
        continue;
      }

      // Atualizar no banco
      await prisma.competitionToken.update({
        where: { id: competitionToken.id },
        data: {
          currentPrice: freshData.current_price,
          priceChange24h: freshData.price_change_percentage_24h,
          priceChange7d: freshData.price_change_percentage_7d_in_currency,
          marketCap: freshData.market_cap,
          marketCapRank: freshData.market_cap_rank,
          imageUrl: freshData.image
        }
      });

      console.log(`✅ ${competitionToken.symbol}: $${freshData.current_price} (MarketCap: $${freshData.market_cap.toLocaleString('en-US')})`);
      updated++;
    }

    console.log(`\n📊 RESUMO:`);
    console.log(`   ✅ Tokens atualizados: ${updated}`);
    console.log(`   ⚠️  Tokens ignorados: ${skipped}`);
    console.log(`   📊 Total: ${competition.competitionTokens.length}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCompetitionPrices();
