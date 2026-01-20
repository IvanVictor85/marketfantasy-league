const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Definir quais IDs manter (os corretos) e quais remover (duplicados incorretos)
const DUPLICATES_TO_REMOVE = [
  'matic-network', // POL antigo (manter polygon-ecosystem-token)
  'wrapped-solana', // SOL wrapped (manter solana)
  'binance-bridged-usdc-bnb-smart-chain', // USDC BSC (manter usd-coin)
  'binance-peg-weth', // WETH BSC (manter weth)
  'astroport-fi' // ASTER incorreto (manter aster-2)
];

// IDs que NUNCA devem ser adicionados (wrapped, bridged, etc)
const BLACKLIST_IDS = [
  'matic-network',
  'wrapped-solana',
  'binance-bridged-usdc-bnb-smart-chain',
  'binance-peg-weth',
  'astroport-fi',
  'wrapped-bitcoin', // Evitar wrapped BTC também
  'wrapped-eeth',
  'wrapped-steth',
  'binance-bridged-usdt-bnb-smart-chain'
];

async function fixDuplicates() {
  console.log('🔧 Removendo tokens duplicados...\n');

  try {
    const comp = await prisma.competition.findFirst({
      where: {
        OR: [{ status: 'ACTIVE' }, { status: 'PENDING' }]
      },
      orderBy: { startDate: 'desc' },
      include: {
        competitionTokens: true
      }
    });

    console.log(`📊 Competição: ${comp.id}`);
    console.log(`📊 Tokens atuais: ${comp.competitionTokens.length}\n`);

    // Encontrar tokens a remover
    const tokensToRemove = comp.competitionTokens.filter(t =>
      DUPLICATES_TO_REMOVE.includes(t.tokenId)
    );

    console.log(`🗑️  Tokens a remover (${tokensToRemove.length}):`);
    tokensToRemove.forEach(t => {
      console.log(`   - ${t.symbol} (${t.tokenId}) - Rank ${t.marketCapRank}`);
    });
    console.log('');

    // Remover duplicados
    for (const token of tokensToRemove) {
      await prisma.competitionToken.delete({
        where: { id: token.id }
      });
      console.log(`✅ Removido: ${token.symbol} (${token.tokenId})`);
    }

    console.log('');

    // Buscar tokens válidos para substituir
    const tokensAfterRemoval = await prisma.competition.findFirst({
      where: { id: comp.id },
      include: { competitionTokens: true }
    });

    const currentCount = tokensAfterRemoval.competitionTokens.length;
    const tokensNeeded = 100 - currentCount;

    console.log(`📊 Tokens restantes: ${currentCount}`);
    console.log(`📊 Tokens necessários: ${tokensNeeded}\n`);

    if (tokensNeeded > 0) {
      console.log('🌐 Buscando tokens de substituição do CoinGecko...\n');

      const allValidTokens = [];
      for (let page = 1; page <= 3; page++) {
        const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
        url.searchParams.set('vs_currency', 'usd');
        url.searchParams.set('order', 'market_cap_desc');
        url.searchParams.set('per_page', '100');
        url.searchParams.set('page', page.toString());

        const response = await fetch(url.toString(), {
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const valid = data.filter(t => t.current_price && t.current_price > 0);
          allValidTokens.push(...valid);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // IDs existentes (após remoção de duplicados)
      const existingIds = new Set(
        tokensAfterRemoval.competitionTokens.map(t => t.tokenId)
      );

      // Filtrar tokens que ainda não temos E não estão na blacklist
      const replacements = allValidTokens
        .filter(t => !existingIds.has(t.id) && !BLACKLIST_IDS.includes(t.id))
        .slice(0, tokensNeeded);

      console.log(`✅ Tokens de substituição encontrados: ${replacements.length}\n`);

      replacements.forEach(t => {
        console.log(`   Rank ${t.market_cap_rank} - ${t.symbol.toUpperCase()} (${t.id}) - $${t.current_price}`);
      });
      console.log('');

      // Adicionar novos tokens
      const tokensToCreate = replacements.map(t => ({
        competitionId: comp.id,
        tokenId: t.id,
        symbol: t.symbol.toUpperCase(),
        name: t.name,
        imageUrl: t.image,
        marketCapRank: t.market_cap_rank
      }));

      if (tokensToCreate.length > 0) {
        await prisma.competitionToken.createMany({
          data: tokensToCreate,
          skipDuplicates: true
        });
        console.log(`✅ ${tokensToCreate.length} novos tokens adicionados!\n`);
      }
    }

    // Verificar resultado final
    const final = await prisma.competition.findFirst({
      where: { id: comp.id },
      include: { competitionTokens: true }
    });

    console.log('📊 RESULTADO FINAL:');
    console.log(`   Total de tokens: ${final.competitionTokens.length}`);
    console.log(`   Esperado: 100`);
    console.log(`   Status: ${final.competitionTokens.length === 100 ? '✅ SUCESSO' : '⚠️ INCOMPLETO'}`);

    // Verificar se ainda há duplicados
    const symbolCounts = {};
    final.competitionTokens.forEach(t => {
      const symbol = t.symbol.toUpperCase();
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });

    const duplicates = Object.entries(symbolCounts).filter(([_, count]) => count > 1);

    if (duplicates.length > 0) {
      console.log('\n⚠️ Ainda há duplicados:');
      duplicates.forEach(([symbol, count]) => {
        console.log(`   ${symbol}: ${count}x`);
      });
    } else {
      console.log('\n✅ Nenhum duplicado restante!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicates();
