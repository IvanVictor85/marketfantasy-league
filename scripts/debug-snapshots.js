const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSnapshots() {
  try {
    console.log('🔍 Verificando snapshots de preços...\n');

    // Buscar competições
    const competitions = await prisma.competition.findMany({
      where: {
        status: { in: ['COMPLETED', 'ACTIVE'] }
      },
      select: {
        id: true,
        name: true,
        status: true
      },
      take: 3,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📋 Competições encontradas: ${competitions.length}\n`);

    for (const comp of competitions) {
      console.log(`\n🏁 ${comp.name} (${comp.status})`);
      console.log(`   ID: ${comp.id}\n`);

      // Buscar tokens desta competição
      const tokens = await prisma.competitionToken.findMany({
        where: { competitionId: comp.id },
        select: {
          symbol: true,
          name: true,
          imageUrl: true,
          priceStart: true,
          priceEnd: true,
          percentChange: true
        },
        take: 5
      });

      if (tokens.length === 0) {
        console.log('   ⚠️ Nenhum token encontrado!\n');
        continue;
      }

      console.log(`   📊 ${tokens.length} tokens:`);
      tokens.forEach((token, i) => {
        console.log(`   ${i + 1}. ${token.symbol} - ${token.name}`);
        console.log(`      Preço Início: ${token.priceStart || 'N/A'}`);
        console.log(`      Preço Fim: ${token.priceEnd || 'N/A'}`);
        console.log(`      Variação: ${token.percentChange || 'N/A'}%`);
        console.log(`      Imagem: ${token.imageUrl ? 'Sim' : 'Não'}`);
        console.log('');
      });
    }

    // Verificar mainTeam de um usuário
    console.log('\n\n👤 Verificando dados do mainTeam...\n');
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        username: true,
        mainTeam: true
      }
    });

    if (user) {
      console.log(`Usuário: ${user.username || user.email}`);
      console.log(`MainTeam: ${JSON.stringify(user.mainTeam, null, 2)}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSnapshots();
