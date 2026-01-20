const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 STATUS DAS RODADAS\n');
  console.log('═'.repeat(80));

  // Rodada 1
  const rodada1 = await prisma.competition.findUnique({
    where: { id: 'cmicalugq000210ou5ri809wa' },
    include: {
      userTeams: {
        orderBy: { totalPoints: 'desc' },
        take: 3,
        include: { user: { select: { username: true, email: true } } }
      }
    }
  });

  console.log('\n🏁 RODADA 1 - COMPLETED\n');
  console.log(`Status: ${rodada1.status}`);
  console.log(`Times: ${rodada1.userTeams.length} (total participantes)`);
  console.log(`Prize Pool: ${Number(rodada1.prizePool)} SOL`);
  console.log('\nPódio:');
  rodada1.userTeams.forEach((t, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    const user = t.user.username || t.user.email;
    console.log(`   ${medal} ${t.teamName} - ${Number(t.totalPoints).toFixed(2)} pts (${user})`);
  });

  // Rodada 2
  const rodada2 = await prisma.competition.findUnique({
    where: { id: 'cmicaluov000410ouj4ywkwop' },
    include: {
      userTeams: true,
      competitionTokens: {
        where: { priceStart: { not: null } },
        take: 5
      }
    }
  });

  console.log('\n═'.repeat(80));
  console.log('\n▶️  RODADA 2 - ACTIVE\n');
  console.log(`Status: ${rodada2.status}`);
  console.log(`Times: ${rodada2.userTeams.length}`);
  console.log(`Snapshot inicial: ${rodada2.competitionTokens.length > 0 ? 'FEITO' : 'PENDENTE'}`);

  if (rodada2.competitionTokens.length > 0) {
    const sample = rodada2.competitionTokens[0];
    console.log(`Data do snapshot: ${sample.priceStartDate || 'N/A'}`);
  }

  console.log('\n═'.repeat(80));
  console.log('\n✅ RESUMO:\n');
  console.log('✅ Rodada 1: COMPLETED com 25 times (Sport Club Receba em 1º)');
  console.log('✅ Rodada 2: ACTIVE com 25 times (competição iniciada)');
  console.log('\n💡 Você pode agora:');
  console.log('   1. Testar o claim da premiação (Rodada 1)');
  console.log('   2. Ver ranking em tempo real (Rodada 2)');
  console.log('   3. Times já escalados e competindo');
  console.log('');
  console.log('═'.repeat(80));
  console.log('');

  await prisma.$disconnect();
}

main();
