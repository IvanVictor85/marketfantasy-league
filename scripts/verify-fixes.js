const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserTeam() {
  console.log('Verificando times do usuario...\n');

  const teams = await prisma.team.findMany({
    include: {
      tokens: true
    }
  });

  console.log('Total de times:', teams.length);
  console.log('');

  teams.forEach(team => {
    console.log('Time:', team.teamName);
    console.log('  Tokens:', team.tokens?.length || 0);

    const pol = team.tokens?.find(t => t.symbol === 'POL');
    if (pol) {
      console.log('  POL no time:');
      console.log('    Symbol:', pol.symbol);
      console.log('    TokenId:', pol.tokenId);
      console.log('');
    }
  });

  await prisma.$disconnect();
}

checkUserTeam();
