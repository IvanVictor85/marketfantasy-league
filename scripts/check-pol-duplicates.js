const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPolDuplicates() {
  console.log('🔍 Verificando duplicatas de POL...\n');

  try {
    const comp = await prisma.competition.findFirst({
      where: {
        OR: [{ status: 'ACTIVE' }, { status: 'PENDING' }]
      },
      orderBy: { startDate: 'desc' },
      include: {
        competitionTokens: {
          orderBy: { marketCapRank: 'asc' }
        }
      }
    });

    console.log(`📊 Competição: ${comp.id}`);
    console.log(`📊 Total de tokens: ${comp.competitionTokens.length}\n`);

    // Buscar todos os POL
    const polTokens = comp.competitionTokens.filter(t =>
      t.symbol.toUpperCase() === 'POL' ||
      t.tokenId.toLowerCase().includes('polygon') ||
      t.name.toLowerCase().includes('polygon')
    );

    console.log(`🔍 Tokens relacionados a POL/Polygon: ${polTokens.length}\n`);

    polTokens.forEach((token, idx) => {
      console.log(`Token ${idx + 1}:`);
      console.log(`  ID no banco: ${token.id}`);
      console.log(`  Symbol: ${token.symbol}`);
      console.log(`  TokenId: ${token.tokenId}`);
      console.log(`  Name: ${token.name}`);
      console.log(`  Rank: ${token.marketCapRank}`);
      console.log('');
    });

    // Verificar tokens duplicados por símbolo
    const symbolCounts = {};
    comp.competitionTokens.forEach(t => {
      const symbol = t.symbol.toUpperCase();
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });

    const duplicates = Object.entries(symbolCounts).filter(([_, count]) => count > 1);

    if (duplicates.length > 0) {
      console.log('⚠️ Símbolos duplicados encontrados:');
      duplicates.forEach(([symbol, count]) => {
        console.log(`  ${symbol}: ${count}x`);
        const tokens = comp.competitionTokens.filter(t => t.symbol.toUpperCase() === symbol);
        tokens.forEach(t => {
          console.log(`    - ID: ${t.tokenId}, Rank: ${t.marketCapRank}`);
        });
      });
    } else {
      console.log('✅ Nenhum símbolo duplicado encontrado');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
  }
}

checkPolDuplicates();
