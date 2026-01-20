const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listLeagues() {
  try {
    const leagues = await prisma.league.findMany();
    console.log(`\n📋 Ligas encontradas: ${leagues.length}\n`);
    leagues.forEach(l => {
      console.log(`  - ${l.name}`);
      console.log(`    ID: ${l.id}`);
      console.log(`    Entry Fee: ${l.entryFee} SOL`);
      console.log(`    Treasury: ${l.treasuryWallet || 'Não configurado'}\n`);
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listLeagues();
