const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEntryFee() {
  console.log('🔧 Atualizando taxa de entrada da Liga Principal...\n');

  // Buscar Liga Principal
  const league = await prisma.league.findFirst({
    where: {
      name: 'Liga Principal MarketFantasy'
    }
  });

  if (!league) {
    console.log('❌ Liga Principal não encontrada');
    await prisma.$disconnect();
    return;
  }

  console.log('📊 Taxa atual:', league.entryFee, 'SOL');

  // Atualizar para 0.025 SOL
  await prisma.league.update({
    where: { id: league.id },
    data: { entryFee: 0.025 }
  });

  console.log('✅ Taxa atualizada para: 0.025 SOL');

  // Verificar
  const updated = await prisma.league.findFirst({
    where: { name: 'Liga Principal MarketFantasy' }
  });

  console.log('\n📋 Confirmação:');
  console.log('   Liga:', updated.name);
  console.log('   Taxa de Entrada:', updated.entryFee, 'SOL');
  console.log('\n💰 Distribuição por entrada:');
  console.log('   Temporada (18%):', (updated.entryFee * 0.18).toFixed(5), 'SOL');
  console.log('   Rodada (70%):', (updated.entryFee * 0.70).toFixed(5), 'SOL');
  console.log('   Tesouro (12%):', (updated.entryFee * 0.12).toFixed(4), 'SOL');

  await prisma.$disconnect();
}

updateEntryFee();
