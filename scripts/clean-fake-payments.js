const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanFakePayments() {
  try {
    console.log('🧹 Limpando pagamentos falsos do banco de dados...\n');

    // 1. Listar todos os pagamentos
    const allPayments = await prisma.leagueEntry.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    console.log(`📊 Total de pagamentos no banco: ${allPayments.length}\n`);

    // 2. Identificar pagamentos falsos (TXs que não são hashes válidos do Solana)
    // Hashes válidos do Solana têm ~88 caracteres e são base58
    const fakePayments = allPayments.filter(p => {
      const tx = p.transactionHash;
      // Padrões de teste conhecidos
      return tx.startsWith('TEST_') ||
             tx.startsWith('COMP_') ||
             tx.startsWith('FIX_') ||
             tx.startsWith('test-tx-') ||
             tx.length < 64; // Hashes reais têm pelo menos 64 caracteres
    });

    console.log(`🔍 Pagamentos falsos identificados: ${fakePayments.length}`);
    console.log(`✅ Pagamentos reais: ${allPayments.length - fakePayments.length}\n`);

    if (fakePayments.length === 0) {
      console.log('✅ Nenhum pagamento falso encontrado!');
      return;
    }

    console.log('📋 Lista de pagamentos falsos:\n');
    fakePayments.forEach((p, i) => {
      console.log(`${i + 1}. ${p.user.name || p.user.email}`);
      console.log(`   TX: ${p.transactionHash.substring(0, 40)}...`);
      console.log(`   Valor: ${p.amountPaid} SOL`);
      console.log(`   Data: ${p.createdAt}\n`);
    });

    // 3. Perguntar confirmação
    console.log('⚠️  ATENÇÃO: Isto irá DELETAR permanentemente esses registros!');
    console.log('⚠️  Execute este script com o parâmetro --confirm para confirmar:\n');
    console.log('   node scripts/clean-fake-payments.js --confirm\n');

    // Verificar se o usuário passou --confirm
    const confirmed = process.argv.includes('--confirm');

    if (!confirmed) {
      console.log('❌ Operação cancelada (use --confirm para executar)');
      return;
    }

    console.log('🗑️  Deletando pagamentos falsos...\n');

    // 4. Deletar pagamentos falsos
    const deleteResult = await prisma.leagueEntry.deleteMany({
      where: {
        id: {
          in: fakePayments.map(p => p.id)
        }
      }
    });

    console.log(`✅ ${deleteResult.count} pagamentos falsos deletados!`);

    // 5. Verificar estado final
    const remaining = await prisma.leagueEntry.count();
    console.log(`\n📊 Pagamentos restantes no banco: ${remaining}`);

    // 6. Calcular total correto
    const remainingPayments = await prisma.leagueEntry.findMany();
    const totalCorrect = remainingPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    console.log(`💰 Total correto no DB: ${totalCorrect.toFixed(6)} SOL`);
    console.log(`💰 Total no Vault: 0.065 SOL (verificado anteriormente)`);

    const diff = totalCorrect - 0.065;
    if (Math.abs(diff) < 0.001) {
      console.log(`\n✅ DB e Vault estão SINCRONIZADOS!`);
    } else {
      console.log(`\n⚠️  Diferença DB vs Vault: ${diff.toFixed(6)} SOL`);
      console.log(`   Isto pode indicar que alguns pagamentos no DB ainda não chegaram ao vault.`);
    }

    console.log('\n✅ Limpeza concluída!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanFakePayments();
