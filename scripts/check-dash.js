const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDash() {
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

    const dash = comp.competitionTokens.find(t => t.symbol === 'DASH');

    if (dash) {
      console.log('✅ DASH está disponível na competição:');
      console.log(`  Symbol: ${dash.symbol}`);
      console.log(`  TokenId: ${dash.tokenId}`);
      console.log(`  Rank: ${dash.marketCapRank}`);
      console.log(`  Name: ${dash.name}`);
    } else {
      console.log('❌ DASH NÃO está disponível na competição');
      console.log('\nTokens disponíveis (símbolos):');
      console.log(comp.competitionTokens.map(t => t.symbol).sort().join(', '));
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro:', error);
    await prisma.$disconnect();
  }
}

checkDash();
