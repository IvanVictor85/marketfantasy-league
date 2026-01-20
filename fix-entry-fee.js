const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Corrigindo entryFee da Liga Principal de 0.01 para 0.025 SOL...\n');

  // 1. Buscar a Liga Principal
  const mainLeague = await prisma.league.findFirst({
    where: {
      OR: [
        { name: 'Liga Principal MarketFantasy' },
        { id: 'cmh3qcrw80000cjvdrwtvt65i' }
      ]
    }
  });

  if (!mainLeague) {
    console.log('❌ Liga Principal não encontrada no banco de dados');
    await prisma.$disconnect();
    return;
  }

  console.log('📋 Liga encontrada:');
  console.log('   ID:', mainLeague.id);
  console.log('   Nome:', mainLeague.name);
  console.log('   Entry Fee ATUAL:', mainLeague.entryFee, 'SOL');
  console.log('');

  if (parseFloat(mainLeague.entryFee) === 0.025) {
    console.log('✅ Entry fee já está correto (0.025 SOL)! Nenhuma ação necessária.');
    await prisma.$disconnect();
    return;
  }

  // 2. Atualizar o entryFee
  console.log('🔄 Atualizando entry fee para 0.025 SOL...');

  const updatedLeague = await prisma.league.update({
    where: { id: mainLeague.id },
    data: {
      entryFee: 0.025
    }
  });

  console.log('✅ Liga atualizada com sucesso!');
  console.log('   Entry Fee NOVO:', updatedLeague.entryFee, 'SOL');
  console.log('');
  console.log('🎉 Correção concluída! A Liga Principal agora exibe 0.025 SOL.');

  await prisma.$disconnect();
}

main()
  .catch(error => {
    console.error('💥 Erro durante execução:', error);
    prisma.$disconnect();
    process.exit(1);
  });
