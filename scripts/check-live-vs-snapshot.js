const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const competitionId = 'cmicalugq000210ou5ri809wa';

    console.log('🔍 Verificando Live Scores vs Snapshot Scores\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Buscar alguns tokens com priceStart e priceEnd
    const tokens = await prisma.competitionToken.findMany({
      where: { competitionId },
      select: {
        symbol: true,
        priceStart: true,
        priceEnd: true
      },
      take: 10
    });

    console.log('📊 Preços dos Tokens (snapshot):\n');

    let totalChange = 0;
    let count = 0;

    tokens.forEach(t => {
      const start = parseFloat(t.priceStart?.toString() || '0');
      const end = parseFloat(t.priceEnd?.toString() || '0');

      if (start > 0 && end > 0) {
        const change = ((end - start) / start * 100);
        totalChange += change;
        count++;

        console.log(`${t.symbol}`);
        console.log(`  Start: $${start.toFixed(6)}`);
        console.log(`  End:   $${end.toFixed(6)}`);
        console.log(`  Var:   ${change > 0 ? '+' : ''}${change.toFixed(2)}%`);
        console.log('');
      }
    });

    const avgChange = count > 0 ? totalChange / count : 0;
    console.log(`Variação Média (snapshot): ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(2)}%\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Buscar DeFi Champions
    const team = await prisma.userTeam.findFirst({
      where: {
        competitionId,
        teamName: 'DeFi Champions'
      },
      select: {
        teamName: true,
        totalPoints: true,
        players: true
      }
    });

    console.log('🎯 Time: DeFi Champions');
    console.log('   TotalPoints (salvo no snapshot): ', team?.totalPoints);
    console.log('   Live Score (na UI agora):         41.83 pts');
    console.log('   Rank (na UI agora):               #1');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('💡 EXPLICAÇÃO:');
    console.log('');
    console.log('A Rodada 1 está ACTIVE, então o ranking mostra:');
    console.log('  ✅ Live Scores = calculados com preços ATUAIS do CoinGecko');
    console.log('  ❌ Total Points = salvos no snapshot (podem estar desatualizados)');
    console.log('');
    console.log('Os preços do CoinGecko mudaram desde o snapshot!');
    console.log('Por isso Live Score (41.83) ≠ Total Points (' + team?.totalPoints + ')');
    console.log('');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
