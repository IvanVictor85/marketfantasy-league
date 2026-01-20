const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCompetitionTo100Tokens() {
  console.log('🔧 Atualizando competição para ter 100 tokens...\n');

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
    console.log(`📊 Tokens atuais: ${competition.competitionTokens.length}\n`);

    if (competition.competitionTokens.length >= 100) {
      console.log('✅ A competição já tem 100 ou mais tokens!');
      await prisma.$disconnect();
      return;
    }

    const tokensNeeded = 100 - competition.competitionTokens.length;
    console.log(`🎯 Precisamos adicionar ${tokensNeeded} tokens\n`);

    // Buscar Top 100+ da CoinGecko com backfill
    console.log('🌐 Buscando tokens da CoinGecko com backfill...');

    const allTokens = [];
    let page = 1;
    const TARGET_COUNT = 100;
    const MAX_PAGES = 3;

    while (allTokens.length < TARGET_COUNT && page <= MAX_PAGES) {
      console.log(`📄 Buscando página ${page}...`);

      const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
      url.searchParams.set('vs_currency', 'usd');
      url.searchParams.set('order', 'market_cap_desc');
      url.searchParams.set('per_page', '100');
      url.searchParams.set('page', page.toString());
      url.searchParams.set('price_change_percentage', '1h,24h,7d,30d');

      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        console.log(`❌ Erro na API: ${response.status}`);
        break;
      }

      const pageData = await response.json();
      console.log(`   ✅ ${pageData.length} tokens recebidos`);

      // Filtrar apenas válidos
      const validTokens = pageData.filter(t => t.current_price && t.current_price > 0);
      console.log(`   ✅ Válidos: ${validTokens.length}`);

      const tokensToAdd = validTokens.slice(0, TARGET_COUNT - allTokens.length);
      allTokens.push(...tokensToAdd);

      console.log(`   📊 Total: ${allTokens.length}/${TARGET_COUNT}`);

      if (allTokens.length >= TARGET_COUNT || pageData.length === 0) {
        break;
      }

      page++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Total de tokens buscados: ${allTokens.length}\n`);

    // Encontrar IDs dos tokens que já existem
    const existingIds = new Set(competition.competitionTokens.map(t => t.tokenId));

    // Filtrar tokens que ainda não existem
    const newTokens = allTokens.filter(t => !existingIds.has(t.id));

    console.log(`📋 Tokens novos a adicionar: ${newTokens.length}`);

    if (newTokens.length === 0) {
      console.log('⚠️ Nenhum token novo para adicionar');
      await prisma.$disconnect();
      return;
    }

    // Adicionar tokens faltantes
    const tokensToCreate = newTokens
      .slice(0, tokensNeeded)
      .map(token => ({
        competitionId: competition.id,
        tokenId: token.id,
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        imageUrl: token.image,
        marketCapRank: token.market_cap_rank
      }));

    await prisma.competitionToken.createMany({
      data: tokensToCreate,
      skipDuplicates: true
    });

    console.log(`\n✅ ${tokensToCreate.length} tokens adicionados com sucesso!\n`);

    // Verificar total final
    const updatedCompetition = await prisma.competition.findUnique({
      where: { id: competition.id },
      include: {
        competitionTokens: true
      }
    });

    console.log('📊 RESULTADO FINAL:');
    console.log(`   Antes: ${competition.competitionTokens.length} tokens`);
    console.log(`   Depois: ${updatedCompetition.competitionTokens.length} tokens`);
    console.log(`   Meta: 100 tokens`);
    console.log(`   Status: ${updatedCompetition.competitionTokens.length >= 100 ? '✅ SUCESSO' : '⚠️ INCOMPLETO'}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompetitionTo100Tokens();
