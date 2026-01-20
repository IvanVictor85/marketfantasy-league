const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Tokens que definitivamente não funcionam (não estão no endpoint /markets da CoinGecko)
const INVALID_TOKENS = [
  'canton', // CC - não está disponível no /markets
  'gatetoken', // GT - ID incorreto ou não disponível
  'kinetiq-staked-hype', // KHYPE - não disponível
  'falcon-usd' // USDF - não disponível
];

async function fixRemaining5Tokens() {
  console.log('Corrigindo os 5 tokens restantes...\n');

  try {
    const competition = await prisma.competition.findFirst({
      where: {
        OR: [{ status: 'PENDING' }, { status: 'ACTIVE' }]
      },
      orderBy: { startDate: 'desc' },
      include: { competitionTokens: true }
    });

    if (!competition) {
      console.log('Nenhuma competicao ativa');
      await prisma.$disconnect();
      return;
    }

    console.log(`Competicao: ${competition.id}\n`);

    // 1. Corrigir CRO: crypto-com-coin -> crypto-com-chain
    const croToken = await prisma.competitionToken.findFirst({
      where: {
        competitionId: competition.id,
        symbol: 'CRO'
      }
    });

    if (croToken && croToken.tokenId === 'crypto-com-coin') {
      console.log('Corrigindo CRO...');
      await prisma.competitionToken.update({
        where: { id: croToken.id },
        data: { tokenId: 'crypto-com-chain' }
      });
      console.log('  CRO atualizado: crypto-com-coin -> crypto-com-chain\n');
    } else if (croToken) {
      console.log(`CRO ja esta correto: ${croToken.tokenId}\n`);
    }

    // 2. Remover tokens inválidos
    const tokensToRemove = await prisma.competitionToken.findMany({
      where: {
        competitionId: competition.id,
        tokenId: { in: INVALID_TOKENS }
      }
    });

    console.log(`Tokens invalidos a remover: ${tokensToRemove.length}`);
    tokensToRemove.forEach(t => {
      console.log(`  - ${t.symbol} (${t.tokenId})`);
    });
    console.log('');

    for (const token of tokensToRemove) {
      await prisma.competitionToken.delete({
        where: { id: token.id }
      });
      console.log(`  Removido: ${token.symbol}`);
    }

    console.log('');

    // 3. Buscar tokens de substituição
    if (tokensToRemove.length > 0) {
      console.log(`Buscando ${tokensToRemove.length} tokens de substituicao...\n`);

      const allValidTokens = [];
      for (let page = 1; page <= 2; page++) {
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
          const valid = data.filter(t =>
            t.current_price && t.current_price > 0 && !INVALID_TOKENS.includes(t.id)
          );
          allValidTokens.push(...valid);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // IDs existentes (excluindo os removidos)
      const existingIds = new Set(
        competition.competitionTokens
          .filter(t => !INVALID_TOKENS.includes(t.tokenId))
          .map(t => t.tokenId)
      );

      // CRO corrigido
      existingIds.add('crypto-com-chain');

      const replacements = allValidTokens
        .filter(t => !existingIds.has(t.id))
        .slice(0, tokensToRemove.length);

      console.log('Tokens de substituicao:');
      replacements.forEach(t => {
        console.log(`  Rank ${t.market_cap_rank} - ${t.symbol.toUpperCase()} (${t.id}) - $${t.current_price}`);
      });
      console.log('');

      // Adicionar tokens de substituição
      const tokensToCreate = replacements.map(t => ({
        competitionId: competition.id,
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
        console.log(`${tokensToCreate.length} tokens adicionados!\n`);
      }
    }

    // Verificar resultado final
    const final = await prisma.competition.findUnique({
      where: { id: competition.id },
      include: { competitionTokens: true }
    });

    console.log('RESULTADO FINAL:');
    console.log(`  Total de tokens: ${final.competitionTokens.length}`);
    console.log(`  Esperado: 100`);
    console.log(`  Status: ${final.competitionTokens.length === 100 ? 'SUCESSO' : 'INCOMPLETO'}`);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRemaining5Tokens();
