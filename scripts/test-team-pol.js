const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTeams() {
  const teams = await prisma.team.findMany();
  
  console.log('Total de times:', teams.length, '\n');
  
  for (const team of teams) {
    console.log('Time:', team.teamName);
    
    let tokens = [];
    try {
      tokens = JSON.parse(team.tokens || '[]');
    } catch (e) {
      console.log('  Erro ao fazer parse dos tokens');
    }
    
    console.log('  Total de tokens:', tokens.length);
    console.log('  Tokens do time:');
    tokens.forEach((t, idx) => {
      console.log(`    ${idx + 1}. ${t.symbol} - ${t.tokenId || t.id || 'sem ID'}`);
    });

    const pol = tokens.find(t => t.symbol === 'POL');
    if (pol) {
      console.log('\n  POL encontrado no time:');
      console.log('    Symbol:', pol.symbol);
      console.log('    TokenId:', pol.tokenId || pol.id);
    } else {
      console.log('\n  POL NAO esta no time!');
    }
    console.log('');
  }
  
  await prisma.$disconnect();
}

checkTeams();
