const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugPaymentIssue() {
  try {
    console.log('🔍 Analisando problema de pagamento...\n');

    // 1. Verificar entry fee da liga principal
    console.log('1️⃣ Verificando Entry Fee da Liga Principal:');
    const mainLeague = await prisma.league.findFirst();

    if (!mainLeague) {
      console.log('   ❌ Liga principal não encontrada!');
      return;
    }

    console.log(`   ID: ${mainLeague.id}`);
    console.log(`   Nome: ${mainLeague.name}`);
    console.log(`   Entry Fee: ${mainLeague.entryFee} SOL`);
    console.log(`   Entry Fee (tipo): ${typeof mainLeague.entryFee}`);
    console.log(`   Entry Fee (JSON): ${JSON.stringify(mainLeague.entryFee)}\n`);

    // 2. Verificar competição ativa
    console.log('2️⃣ Verificando Competição Ativa:');
    const activeComp = await prisma.competition.findFirst({
      where: {
        status: 'ACTIVE',
        leagueId: mainLeague.id
      },
      include: { league: true }
    });

    if (!activeComp) {
      console.log('   ⚠️ Nenhuma competição ativa encontrada\n');
    } else {
      console.log(`   ID: ${activeComp.id}`);
      console.log(`   Nome: ${activeComp.name}`);
      console.log(`   Entry Fee (da liga): ${activeComp.league.entryFee} SOL`);
      console.log(`   Prize Pool: ${activeComp.prizePool} SOL\n`);
    }

    // 3. Verificar últimos pagamentos
    console.log('3️⃣ Últimos 5 Pagamentos:');
    const recentPayments = await prisma.leagueEntry.findMany({
      where: { status: 'CONFIRMED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });

    if (recentPayments.length === 0) {
      console.log('   ⚠️ Nenhum pagamento encontrado\n');
    } else {
      for (const payment of recentPayments) {
        console.log(`\n   ${recentPayments.indexOf(payment) + 1}. ${payment.user.name || payment.user.email}`);
        console.log(`      Valor pago: ${payment.amountPaid} SOL`);
        console.log(`      Entry fee esperado: ${mainLeague.entryFee} SOL`);
        console.log(`      Diferença: ${Math.abs(Number(payment.amountPaid) - Number(mainLeague.entryFee)).toFixed(6)} SOL`);
        console.log(`      TX: ${payment.transactionHash.substring(0, 30)}...`);
        console.log(`      Data: ${payment.createdAt}`);
      }
    }

    // 4. Verificar se há discrepância entre entryFee e valor pago
    console.log('\n\n4️⃣ Análise de Discrepâncias:');
    const allPayments = await prisma.leagueEntry.findMany({
      where: { status: 'CONFIRMED' }
    });

    const discrepancies = allPayments.filter(p => {
      const expected = Number(mainLeague.entryFee);
      const actual = Number(p.amountPaid);
      return Math.abs(expected - actual) > 0.001;
    });

    if (discrepancies.length > 0) {
      console.log(`   ⚠️ Encontradas ${discrepancies.length} discrepâncias!`);
      discrepancies.forEach(d => {
        console.log(`      - TX ${d.transactionHash.substring(0, 20)}: pagou ${d.amountPaid} SOL, esperado ${mainLeague.entryFee} SOL`);
      });
    } else {
      console.log(`   ✅ Todos os pagamentos estão corretos`);
    }

    // 5. Verificar valores que chegaram ao vault vs registros no DB
    console.log('\n\n5️⃣ Vault vs Database:');
    const totalInDb = allPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    console.log(`   Total registrado no DB: ${totalInDb.toFixed(6)} SOL (${allPayments.length} pagamentos)`);
    console.log(`   Total no Vault: 0.065 SOL (verificado anteriormente)`);
    console.log(`   Diferença: ${(totalInDb - 0.065).toFixed(6)} SOL`);
    console.log(`   Pagamentos que NÃO chegaram ao vault: ${(totalInDb - 0.065) / 0.025} pagamentos`);

    console.log('\n✅ Análise concluída');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPaymentIssue();
