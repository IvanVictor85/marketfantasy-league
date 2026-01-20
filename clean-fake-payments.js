const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando pagamentos falsos no banco de dados...\n');

  // 1. Buscar todos os pagamentos com hash de teste
  const fakePayments = await prisma.leagueEntry.findMany({
    where: {
      transactionHash: {
        startsWith: 'TEST_'
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // 2. Buscar informações adicionais de ligas e competições
  const enrichedPayments = await Promise.all(
    fakePayments.map(async (payment) => {
      let league = null;
      let competition = null;

      if (payment.leagueId) {
        league = await prisma.league.findUnique({
          where: { id: payment.leagueId },
          select: {
            id: true,
            name: true,
            entryFee: true
          }
        });
      }

      if (payment.competitionId) {
        competition = await prisma.competition.findUnique({
          where: { id: payment.competitionId },
          select: {
            id: true,
            name: true
          }
        });
      }

      return {
        ...payment,
        league,
        competition
      };
    })
  );

  console.log(`📊 Total de pagamentos falsos encontrados: ${enrichedPayments.length}\n`);

  if (enrichedPayments.length === 0) {
    console.log('✅ Nenhum pagamento falso encontrado!');
    await prisma.$disconnect();
    return;
  }

  // 3. Mostrar detalhes dos pagamentos falsos
  console.log('📋 Detalhes dos pagamentos falsos:\n');
  const leagueStats = {};

  enrichedPayments.forEach((payment, index) => {
    console.log(`${index + 1}. ${payment.user.name} (${payment.user.email})`);
    console.log(`   Liga: ${payment.league?.name || 'N/A'}`);
    console.log(`   Rodada: ${payment.competition?.name || 'N/A'}`);
    console.log(`   Tx Hash: ${payment.transactionHash}`);
    console.log(`   Valor: ${payment.amountPaid} SOL`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Data: ${payment.createdAt.toLocaleString('pt-BR')}`);
    console.log('');

    // Acumular estatísticas por liga
    if (payment.league) {
      const leagueId = payment.league.id;
      if (!leagueStats[leagueId]) {
        leagueStats[leagueId] = {
          name: payment.league.name,
          count: 0,
          totalAmount: 0
        };
      }
      leagueStats[leagueId].count++;
      leagueStats[leagueId].totalAmount = parseFloat(leagueStats[leagueId].totalAmount) + parseFloat(payment.amountPaid);
    }
  });

  // 4. Mostrar estatísticas por liga
  console.log('📊 Estatísticas por liga:\n');
  Object.values(leagueStats).forEach(stats => {
    console.log(`Liga: ${stats.name}`);
    console.log(`  Pagamentos falsos: ${stats.count}`);
    console.log(`  Valor total falso: ${stats.totalAmount.toFixed(3)} SOL`);
    console.log('');
  });

  // 4. Confirmar se deseja deletar
  console.log('⚠️  ATENÇÃO: Este script vai DELETAR os pagamentos falsos do banco de dados!');
  console.log('⚠️  Para executar a limpeza, execute: node clean-fake-payments.js --confirm\n');

  // Verificar se foi passado o flag --confirm
  const shouldDelete = process.argv.includes('--confirm');

  if (!shouldDelete) {
    console.log('ℹ️  Modo de visualização apenas. Nenhuma alteração foi feita.');
    console.log('ℹ️  Para confirmar a limpeza, execute: node clean-fake-payments.js --confirm');
    await prisma.$disconnect();
    return;
  }

  // 5. Deletar pagamentos falsos
  console.log('🗑️  Deletando pagamentos falsos...\n');

  let deletedCount = 0;
  for (const payment of enrichedPayments) {
    try {
      // Deletar o pagamento
      await prisma.leagueEntry.delete({
        where: { id: payment.id }
      });

      deletedCount++;
      console.log(`✅ Deletado: ${payment.user.name} - ${payment.transactionHash.substring(0, 20)}...`);
    } catch (error) {
      console.error(`❌ Erro ao deletar pagamento ${payment.id}:`, error.message);
    }
  }

  console.log('');
  console.log(`🎉 Limpeza concluída! ${deletedCount} de ${enrichedPayments.length} pagamentos falsos foram removidos.`);

  // 6. Verificar se ainda restam pagamentos falsos
  const remainingFake = await prisma.leagueEntry.count({
    where: {
      transactionHash: {
        startsWith: 'TEST_'
      }
    }
  });

  if (remainingFake > 0) {
    console.log(`⚠️  Ainda restam ${remainingFake} pagamentos falsos no banco.`);
  } else {
    console.log('✅ Banco de dados limpo! Nenhum pagamento falso restante.');
  }

  await prisma.$disconnect();
}

main()
  .catch(error => {
    console.error('💥 Erro durante execução:', error);
    prisma.$disconnect();
    process.exit(1);
  });
