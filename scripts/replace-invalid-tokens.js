const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Tokens que não funcionam na CoinGecko
const INVALID_TOKEN_IDS = [
  'canton',
  'function-fbtc',
  'gatetoken',
  'kinetiq-staked-hype',
  'syrup-usdc',
  'falcon-usd',
  'usd-global'
];

async function replaceInvalidTokens() {
  console.log('🔧 Substituindo tokens inválidos por tokens válidos do ranking...\n');

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
    console.log(`📊 Tokens atuais: ${competition.competitionTokens.length}\n`);

    // Encontrar tokens inválidos
    const invalidTokens = competition.competitionTokens.filter(t =>
      INVALID_TOKEN_IDS.includes(t.tokenId)
    );

    console.log(`❌ Tokens inválidos encontrados: ${invalidTokens.length}`);
    invalidTokens.forEach(t => {
      console.log(`   - ${t.symbol} (${t.tokenId})`);
    });
    console.log('');

    if (invalidTokens.length === 0) {
      console.log('✅ Não há tokens inválidos para substituir!');
      await prisma.$disconnect();
      return;
    }

    // Buscar tokens válidos da CoinGecko (páginas 1 e 2)
    console.log('🌐 Buscando tokens válidos da CoinGecko...\n');

    const allValidTokens = [];
    for (let page = 1; page <= 2; page++) {
      console.log(`📄 Página ${page}...`);

      const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
      url.searchParams.set('vs_currency', 'usd');
      url.searchParams.set('order', 'market_cap_desc');
      url.searchParams.set('per_page', '100');
      url.searchParams.set('page', page.toString());
      url.searchParams.set('price_change_percentage', '1h,24h,7d,30d');

      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const pageData = await response.json();
        const validTokens = pageData.filter(t =>
          t.current_price && t.current_price > 0 && !INVALID_TOKEN_IDS.includes(t.id)
        );
        allValidTokens.push(...validTokens);
        console.log(`   ✅ ${validTokens.length} tokens válidos`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Total de tokens válidos disponíveis: ${allValidTokens.length}\n`);

    // IDs dos tokens que já temos (excluindo os inválidos)
    const existingIds = new Set(
      competition.competitionTokens
        .filter(t => !INVALID_TOKEN_IDS.includes(t.tokenId))
        .map(t => t.tokenId)
    );

    // Encontrar novos tokens que ainda não temos
    const replacementTokens = allValidTokens
      .filter(t => !existingIds.has(t.id))
      .slice(0, invalidTokens.length);

    console.log(`🔄 Tokens de substituição (${replacementTokens.length}):`);
    replacementTokens.forEach((t, i) => {
      console.log(`   #${t.market_cap_rank} ${t.symbol.toUpperCase()} - ${t.name} ($${t.current_price})`);
    });
    console.log('');

    if (replacementTokens.length < invalidTokens.length) {
      console.log(`⚠️ Atenção: Só encontramos ${replacementTokens.length} tokens válidos para substituir ${invalidTokens.length} inválidos\n`);
    }

    // Deletar tokens inválidos
    console.log('🗑️  Removendo tokens inválidos...');
    for (const token of invalidTokens) {
      await prisma.competitionToken.delete({
        where: { id: token.id }
      });
      console.log(`   ❌ Removido: ${token.symbol} (${token.tokenId})`);
    }

    console.log('');

    // Adicionar tokens de substituição
    console.log('➕ Adicionando novos tokens...');
    const tokensToCreate = replacementTokens.map(token => ({
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

    tokensToCreate.forEach(t => {
      console.log(`   ✅ Adicionado: ${t.symbol} (${t.tokenId})`);
    });

    console.log('');

    // Verificar resultado final
    const updatedCompetition = await prisma.competition.findUnique({
      where: { id: competition.id },
      include: {
        competitionTokens: true
      }
    });

    console.log('📊 RESULTADO FINAL:');
    console.log(`   Total de tokens: ${updatedCompetition.competitionTokens.length}`);
    console.log(`   Tokens removidos: ${invalidTokens.length}`);
    console.log(`   Tokens adicionados: ${tokensToCreate.length}`);
    console.log(`   Status: ✅ CONCLUÍDO`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

replaceInvalidTokens();
