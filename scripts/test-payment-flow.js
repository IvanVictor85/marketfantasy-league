const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Load environment variables from .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const prisma = new PrismaClient();

async function testPaymentFlow() {
  try {
    console.log('🧪 Testando fluxo de pagamento...\n');

    // 1. Check environment variables
    console.log('1️⃣ Verificando variáveis de ambiente:');
    console.log(`   PROGRAM_ID: ${process.env.NEXT_PUBLIC_PROGRAM_ID || 'NÃO CONFIGURADO'}`);
    console.log(`   RPC_URL: ${process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'NÃO CONFIGURADO'}`);
    console.log(`   TREASURY_WALLET: ${process.env.NEXT_PUBLIC_TREASURY_WALLET || 'NÃO CONFIGURADO'}`);
    console.log(`   NETWORK: ${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}\n`);

    // 2. Check active competition
    console.log('2️⃣ Verificando competição ativa:');
    const activeCompetition = await prisma.competition.findFirst({
      where: { status: 'ACTIVE' },
      include: { league: true }
    });

    if (!activeCompetition) {
      console.log('   ⚠️ Nenhuma competição ativa encontrada');
      return;
    }

    console.log(`   Nome: ${activeCompetition.name}`);
    console.log(`   ID: ${activeCompetition.id}`);
    console.log(`   Entry Fee: ${activeCompetition.league.entryFee} SOL`);
    console.log(`   Entry Fee (lamports): ${activeCompetition.league.entryFee * LAMPORTS_PER_SOL}\n`);

    // 3. Check RPC connection
    console.log('3️⃣ Testando conexão RPC:');
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    try {
      const slot = await connection.getSlot();
      console.log(`   ✅ Conexão bem-sucedida`);
      console.log(`   Slot atual: ${slot}\n`);
    } catch (error) {
      console.log(`   ❌ Erro na conexão: ${error.message}\n`);
      return;
    }

    // 4. Check treasury wallet
    console.log('4️⃣ Verificando treasury wallet:');
    const treasuryWallet = process.env.NEXT_PUBLIC_TREASURY_WALLET ||
                          activeCompetition.league.treasuryWallet;

    if (!treasuryWallet) {
      console.log('   ⚠️ Treasury wallet não configurado\n');
    } else {
      try {
        const treasuryPubkey = new PublicKey(treasuryWallet);
        const balance = await connection.getBalance(treasuryPubkey);
        console.log(`   Wallet: ${treasuryWallet}`);
        console.log(`   Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);
      } catch (error) {
        console.log(`   ❌ Erro ao verificar wallet: ${error.message}\n`);
      }
    }

    // 5. Check recent payments
    console.log('5️⃣ Verificando pagamentos recentes:');
    const recentPayments = await prisma.leagueEntry.findMany({
      where: {
        competitionId: activeCompetition.id,
        status: 'CONFIRMED'
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            publicKey: true
          }
        }
      }
    });

    if (recentPayments.length === 0) {
      console.log('   ⚠️ Nenhum pagamento encontrado\n');
    } else {
      console.log(`   Total de pagamentos: ${recentPayments.length}\n`);
      recentPayments.forEach((payment, index) => {
        console.log(`   ${index + 1}. ${payment.user.name || payment.user.email}`);
        console.log(`      Valor: ${payment.amountPaid} SOL`);
        console.log(`      TX: ${payment.transactionHash.substring(0, 20)}...`);
        console.log(`      Data: ${payment.createdAt}`);
      });
    }

    // 6. Verify payment amounts match entry fee
    console.log('\n6️⃣ Verificando consistência de valores:');
    const expectedFee = Number(activeCompetition.league.entryFee);
    const invalidPayments = recentPayments.filter(p =>
      Math.abs(Number(p.amountPaid) - expectedFee) > 0.001
    );

    if (invalidPayments.length > 0) {
      console.log(`   ⚠️ Encontrados ${invalidPayments.length} pagamentos com valor incorreto:`);
      invalidPayments.forEach(p => {
        console.log(`      - TX ${p.transactionHash}: ${p.amountPaid} SOL (esperado: ${expectedFee} SOL)`);
      });
    } else {
      console.log(`   ✅ Todos os pagamentos estão corretos (${expectedFee} SOL)`);
    }

    // 7. Check prize distribution (use ALL payments, not just recent 5)
    console.log('\n7️⃣ Verificando distribuição de prêmios:');
    const allPayments = await prisma.leagueEntry.findMany({
      where: {
        competitionId: activeCompetition.id,
        status: 'CONFIRMED'
      }
    });

    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    const expectedSeasonPool = totalPaid * 0.18;
    const expectedRoundPool = totalPaid * 0.70;
    const expectedTreasury = totalPaid * 0.12;

    console.log(`   Total arrecadado: ${totalPaid.toFixed(4)} SOL`);
    console.log(`   Temporada (18%): ${expectedSeasonPool.toFixed(4)} SOL`);
    console.log(`   Rodada (70%): ${expectedRoundPool.toFixed(4)} SOL`);
    console.log(`   Tesouro (12%): ${expectedTreasury.toFixed(4)} SOL`);

    const season = await prisma.season.findUnique({
      where: { id: activeCompetition.seasonId }
    });

    console.log(`\n   Prize Pool Real da Temporada: ${season?.prizePool || 0} SOL`);
    console.log(`   Prize Pool Real da Rodada: ${activeCompetition.prizePool} SOL`);

    const seasonDiff = Math.abs(Number(season?.prizePool || 0) - expectedSeasonPool);
    const roundDiff = Math.abs(Number(activeCompetition.prizePool) - expectedRoundPool);

    if (seasonDiff < 0.001 && roundDiff < 0.001) {
      console.log(`   ✅ Distribuição de prêmios está correta`);
    } else {
      console.log(`   ⚠️ Diferenças detectadas:`);
      if (seasonDiff >= 0.001) {
        console.log(`      Temporada: ${seasonDiff.toFixed(4)} SOL de diferença`);
      }
      if (roundDiff >= 0.001) {
        console.log(`      Rodada: ${roundDiff.toFixed(4)} SOL de diferença`);
      }
    }

    console.log('\n✅ Teste de fluxo de pagamento concluído');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentFlow();
