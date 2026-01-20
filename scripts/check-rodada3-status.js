/**
 * 🔍 VERIFICA STATUS DA RODADA 3
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodada3Id = 'cmicalusz000610ousgsnhr2z';

async function main() {
  console.log('\n🔍 VERIFICANDO RODADA 3\n');

  const competition = await prisma.competition.findUnique({
    where: { id: rodada3Id },
    include: {
      userTeams: true,
      competitionTokens: {
        where: { priceStart: { not: null } },
        take: 5
      }
    }
  });

  if (!competition) {
    console.log('❌ Rodada 3 não encontrada');
    return;
  }

  console.log(`📊 Nome: ${competition.name}`);
  console.log(`📊 Status: ${competition.status}`);
  console.log(`📊 Times: ${competition.userTeams.length}`);
  console.log(`📊 Start Date: ${competition.startDate}`);
  console.log(`📊 End Date: ${competition.endDate}`);
  console.log(`📊 Prize Pool: ${Number(competition.prizePool)} SOL`);
  console.log('');

  console.log('📸 SNAPSHOT INICIAL:');
  console.log(`   Tokens com priceStart: ${competition.competitionTokens.length}`);

  if (competition.competitionTokens.length > 0) {
    const sample = competition.competitionTokens[0];
    console.log(`   Exemplo: ${sample.symbol}`);
    console.log(`   Price Start: ${sample.priceStart}`);
    console.log(`   Price Start Date: ${sample.priceStartDate}`);
  }
  console.log('');

  // Verificar se todos os tokens têm priceStart
  const allTokens = await prisma.competitionToken.findMany({
    where: { competitionId: rodada3Id }
  });

  const withPrice = allTokens.filter(t => t.priceStart !== null).length;
  const withoutPrice = allTokens.filter(t => t.priceStart === null).length;

  console.log(`📊 TOKENS:`);
  console.log(`   Total: ${allTokens.length}`);
  console.log(`   Com preço: ${withPrice}`);
  console.log(`   Sem preço: ${withoutPrice}`);
  console.log('');

  if (withoutPrice > 0) {
    console.log('⚠️  TOKENS SEM PREÇO INICIAL:');
    allTokens.filter(t => t.priceStart === null).forEach(t => {
      console.log(`   - ${t.symbol}`);
    });
    console.log('');
  }

  // Testar chamada da API diretamente
  console.log('🧪 TESTANDO API /competition/end...\n');

  try {
    const response = await fetch('http://localhost:3000/api/competition/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitionId: rodada3Id,
        skipTimeValidation: true
      })
    });

    const result = await response.json();

    console.log(`Status HTTP: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Erro na chamada:', error.message);
  }

  await prisma.$disconnect();
}

main();
