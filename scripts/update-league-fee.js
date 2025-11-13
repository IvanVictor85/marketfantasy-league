const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLeagueFee() {
  try {
    console.log('📝 Atualizando entry fee da Liga Principal para 0.01 SOL...\n');

    const league = await prisma.league.updateMany({
      where: { leagueType: 'MAIN' },
      data: { entryFee: 0.01 }
    });

    console.log('✅ Atualizado:', league.count, 'liga(s)');
    console.log('');

    // Verificar
    const updated = await prisma.league.findFirst({
      where: { leagueType: 'MAIN' }
    });

    console.log('🏆 Liga Principal atualizada:');
    console.log('   Nome:', updated?.name);
    console.log('   Entry Fee:', updated?.entryFee, 'SOL');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateLeagueFee();
