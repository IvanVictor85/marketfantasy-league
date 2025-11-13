const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLeagueFee() {
  try {
    const league = await prisma.league.findFirst({
      where: { leagueType: 'MAIN' }
    });

    console.log('🏆 Liga Principal:');
    console.log('   ID:', league?.id);
    console.log('   Nome:', league?.name);
    console.log('   Entry Fee:', league?.entryFee, 'SOL');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeagueFee();
