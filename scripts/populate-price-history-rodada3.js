/**
 * 🔧 POPULA PRICEHISTORY PARA RODADA 3
 *
 * Cria registros na tabela priceHistory usando os dados do CompetitionToken
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodada3Id = 'cmicalusz000610ousgsnhr2z';

async function main() {
  console.log('\n🔧 POPULANDO PRICEHISTORY PARA RODADA 3\n');

  // Verificar se já existem registros
  const existing = await prisma.priceHistory.findMany({
    where: {
      source: `competition_start_${rodada3Id}`
    }
  });

  console.log(`📊 Registros existentes em priceHistory: ${existing.length}`);

  if (existing.length > 0) {
    console.log('✅ PriceHistory já populado!');
    await prisma.$disconnect();
    return;
  }

  // Buscar todos os tokens da competição
  const tokens = await prisma.competitionToken.findMany({
    where: {
      competitionId: rodada3Id,
      priceStart: { not: null }
    }
  });

  console.log(`🔍 Tokens encontrados com priceStart: ${tokens.length}\n`);

  if (tokens.length === 0) {
    console.log('❌ Nenhum token com priceStart encontrado');
    await prisma.$disconnect();
    return;
  }

  // Criar registros no priceHistory
  let created = 0;

  for (const token of tokens) {
    await prisma.priceHistory.create({
      data: {
        tokenSymbol: token.symbol,
        price: Number(token.priceStart),
        timestamp: token.priceStartDate || new Date(),
        source: `competition_start_${rodada3Id}`
      }
    });

    console.log(`   ✅ ${token.symbol}: $${Number(token.priceStart).toFixed(2)}`);
    created++;
  }

  console.log(`\n✅ ${created} registros criados no priceHistory!`);
  console.log('\n💡 Agora é possível finalizar a Rodada 3.\n');

  await prisma.$disconnect();
}

main();
