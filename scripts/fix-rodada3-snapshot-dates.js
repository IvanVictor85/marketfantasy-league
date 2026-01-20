/**
 * 🔧 CORRIGE DATAS DO SNAPSHOT DA RODADA 3
 *
 * Adiciona priceStartDate aos tokens que têm priceStart mas não têm a data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodada3Id = 'cmicalusz000610ousgsnhr2z';

async function main() {
  console.log('\n🔧 CORRIGINDO DATAS DO SNAPSHOT DA RODADA 3\n');

  // Buscar competição
  const competition = await prisma.competition.findUnique({
    where: { id: rodada3Id }
  });

  console.log(`📊 Competição: ${competition.name}`);
  console.log(`📊 Start Date: ${competition.startDate}\n`);

  // Buscar tokens sem data
  const tokens = await prisma.competitionToken.findMany({
    where: {
      competitionId: rodada3Id,
      priceStart: { not: null },
      priceStartDate: null
    }
  });

  console.log(`🔍 Tokens com priceStart mas sem priceStartDate: ${tokens.length}\n`);

  if (tokens.length === 0) {
    console.log('✅ Todos os tokens já têm priceStartDate!');
    await prisma.$disconnect();
    return;
  }

  // Usar a data de início da competição como referência
  const snapshotDate = competition.startDate;

  console.log(`📅 Usando data de snapshot: ${snapshotDate}\n`);

  // Atualizar todos os tokens
  const updated = await prisma.competitionToken.updateMany({
    where: {
      competitionId: rodada3Id,
      priceStart: { not: null },
      priceStartDate: null
    },
    data: {
      priceStartDate: snapshotDate
    }
  });

  console.log(`✅ ${updated.count} tokens atualizados com priceStartDate!\n`);

  // Verificar resultado
  const afterUpdate = await prisma.competitionToken.findMany({
    where: {
      competitionId: rodada3Id,
      priceStart: { not: null }
    },
    take: 5
  });

  console.log('📊 AMOSTRA APÓS ATUALIZAÇÃO:\n');
  afterUpdate.forEach(t => {
    console.log(`   ${t.symbol}: priceStart=$${t.priceStart}, date=${t.priceStartDate}`);
  });

  console.log('\n✅ Correção concluída! Agora é possível finalizar a Rodada 3.\n');

  await prisma.$disconnect();
}

main();
