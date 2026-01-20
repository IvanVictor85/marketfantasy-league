const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Testando cálculo de live scores...\n');

    // Pegar a competição ativa
    const activeComp = await prisma.competition.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        league: { select: { name: true } }
      }
    });

    if (!activeComp) {
      console.log('❌ Nenhuma competição ACTIVE encontrada');
      await prisma.$disconnect();
      return;
    }

    console.log('📊 Competição Ativa:');
    console.log('ID:', activeComp.id);
    console.log('Liga:', activeComp.league?.name);
    console.log('Status:', activeComp.status);
    console.log('Start:', activeComp.startDate);
    console.log('End:', activeComp.endDate);

    // Buscar competitionTokens com priceStart
    const competitionTokens = await prisma.competitionToken.findMany({
      where: { competitionId: activeComp.id },
      select: {
        symbol: true,
        tokenId: true,
        priceStart: true,
        priceEnd: true
      }
    });

    console.log('\n💰 Tokens da competição:');
    console.log('Total:', competitionTokens.length);
    console.log('\nPrimeiros 5 tokens:');
    competitionTokens.slice(0, 5).forEach(t => {
      console.log(`- ${t.symbol}: priceStart=${t.priceStart}, priceEnd=${t.priceEnd}`);
    });

    // Verificar se há priceStart
    const tokensWithPriceStart = competitionTokens.filter(t => t.priceStart && parseFloat(t.priceStart.toString()) > 0);
    console.log(`\n✅ Tokens com priceStart: ${tokensWithPriceStart.length}/${competitionTokens.length}`);

    if (tokensWithPriceStart.length === 0) {
      console.log('\n⚠️ PROBLEMA: Nenhum token tem priceStart!');
      console.log('Isso significa que o snapshot inicial não foi executado.');
      console.log('Sem priceStart, não é possível calcular live scores.');
    }

    // Buscar times
    const userTeams = await prisma.userTeam.findMany({
      where: { competitionId: activeComp.id },
      select: {
        teamName: true,
        totalPoints: true,
        players: true,
        user: {
          select: { name: true }
        }
      },
      take: 3
    });

    console.log('\n⚽ Primeiros 3 times:');
    userTeams.forEach(t => {
      console.log(`\nTime: ${t.teamName} (${t.user.name})`);
      console.log(`Pontos: ${t.totalPoints}`);
      console.log(`Tokens: ${Array.isArray(t.players) ? t.players.join(', ') : 'N/A'}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
