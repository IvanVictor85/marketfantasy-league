const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🧪 POPULAR RODADA PARA TESTES
 *
 * Cria times aleatórios para todos os usuários que ainda não entraram na rodada.
 * Simula pagamento e acumula nos prize pools.
 */

// Top tokens para escolher aleatoriamente
const TOP_TOKENS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'SHIB', 'DOT',
  'LINK', 'UNI', 'AAVE', 'MATIC', 'ATOM', 'FTM', 'NEAR', 'ALGO', 'VET', 'ICP',
  'APT', 'OP', 'ARB', 'LDO', 'GRT', 'MKR', 'SNX', 'RUNE', 'INJ', 'ZEC'
];

/**
 * Gera um time aleatório de 10 tokens únicos
 */
function generateRandomTeam() {
  const shuffled = [...TOP_TOKENS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10);
}

/**
 * Popular rodada com times aleatórios
 */
async function populateRound() {
  console.log('🧪 POPULANDO RODADA PARA TESTES\n');
  console.log('='.repeat(80));

  try {
    // 1️⃣ BUSCAR RODADA ATIVA OU PENDING
    console.log('\n1️⃣ Buscando rodada para popular...');

    const activeRound = await prisma.competition.findFirst({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'ACTIVE' }
        ]
      },
      include: {
        season: true,
        league: true,
        userTeams: true
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    if (!activeRound) {
      console.log('❌ Nenhuma rodada PENDING ou ACTIVE encontrada!');
      console.log('   Crie uma temporada primeiro: node scripts/create-season.js');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Rodada encontrada: ${activeRound.name || activeRound.id}`);
    console.log(`   Status: ${activeRound.status}`);
    console.log(`   Liga: ${activeRound.league.name}`);
    console.log(`   Times já registrados: ${activeRound.userTeams.length}`);

    // 2️⃣ BUSCAR TODOS OS USUÁRIOS
    console.log('\n2️⃣ Buscando usuários...');

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        publicKey: true
      }
    });

    console.log(`   Total de usuários no sistema: ${allUsers.length}`);

    // 3️⃣ IDENTIFICAR USUÁRIOS QUE JÁ ESTÃO NA RODADA
    const usersInRound = new Set(activeRound.userTeams.map(ut => ut.userId));
    const usersToAdd = allUsers.filter(user => !usersInRound.has(user.id));

    console.log(`   Usuários já na rodada: ${usersInRound.size}`);
    console.log(`   Usuários para adicionar: ${usersToAdd.length}`);

    if (usersToAdd.length === 0) {
      console.log('\n✅ Todos os usuários já estão na rodada!');
      await prisma.$disconnect();
      return;
    }

    // 4️⃣ CONFIGURAÇÃO DE VALORES
    const entryFee = 0.025; // 0.025 SOL por entrada
    const roundPrize = entryFee * 0.70;  // 70% para rodada
    const seasonPrize = entryFee * 0.18; // 18% para temporada
    // 12% para manutenção (não registramos aqui)

    console.log(`\n💰 Valores por entrada:`);
    console.log(`   Taxa de entrada: ${entryFee} SOL`);
    console.log(`   → Rodada (70%): ${roundPrize} SOL`);
    console.log(`   → Temporada (18%): ${seasonPrize} SOL`);
    console.log(`   → Manutenção (12%): ${entryFee * 0.12} SOL`);

    // 5️⃣ POPULAR RODADA
    console.log(`\n3️⃣ Criando times aleatórios para ${usersToAdd.length} usuários...\n`);

    let createdCount = 0;

    for (const user of usersToAdd) {
      // Gerar time aleatório
      const randomTeam = generateRandomTeam();

      // Criar UserTeam
      await prisma.userTeam.create({
        data: {
          userId: user.id,
          competitionId: activeRound.id,
          players: randomTeam,
          teamName: user.name || `Time de ${user.email}`,
          totalPoints: 0
        }
      });

      // Criar LeagueEntry (simular pagamento)
      await prisma.leagueEntry.create({
        data: {
          userId: user.id,
          competitionId: activeRound.id,
          userWallet: user.publicKey || 'test-wallet-' + user.id,
          transactionHash: `test-tx-${Date.now()}-${user.id}`,
          amountPaid: entryFee,
          status: 'CONFIRMED'
        }
      });

      createdCount++;

      console.log(`   ✅ ${user.name || user.email}`);
      console.log(`      Time: ${randomTeam.slice(0, 5).join(', ')}...`);
    }

    // 6️⃣ ATUALIZAR PRIZE POOLS
    console.log('\n4️⃣ Atualizando prize pools...');

    const totalRoundPrize = roundPrize * createdCount;
    const totalSeasonPrize = seasonPrize * createdCount;

    await prisma.competition.update({
      where: { id: activeRound.id },
      data: {
        prizePool: { increment: totalRoundPrize }
      }
    });

    if (activeRound.season) {
      await prisma.season.update({
        where: { id: activeRound.season.id },
        data: {
          prizePool: { increment: totalSeasonPrize }
        }
      });
    }

    console.log(`   ✅ Competition.prizePool: +${totalRoundPrize.toFixed(2)} SOL`);
    if (activeRound.season) {
      console.log(`   ✅ Season.prizePool: +${totalSeasonPrize.toFixed(2)} SOL`);
    }

    // 7️⃣ RESUMO FINAL
    const totalTeams = activeRound.userTeams.length + createdCount;
    const totalRevenue = entryFee * createdCount;

    console.log('\n' + '='.repeat(80));
    console.log('✅ RODADA POPULADA COM SUCESSO!\n');
    console.log('📊 RESUMO:');
    console.log('='.repeat(80));
    console.log(`Rodada: ${activeRound.name}`);
    console.log(`Times adicionados: ${createdCount}`);
    console.log(`Total de participantes: ${totalTeams}`);
    console.log(`Receita gerada: ${totalRevenue} SOL`);
    console.log();
    console.log(`💰 PRIZE POOLS ATUALIZADOS:`);
    console.log(`   Rodada: ${totalRoundPrize.toFixed(2)} SOL (70%)`);
    if (activeRound.season) {
      console.log(`   Temporada: ${totalSeasonPrize.toFixed(2)} SOL (18%)`);
    }
    console.log(`   Manutenção: ${(totalRevenue * 0.12).toFixed(2)} SOL (12%)`);
    console.log();
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Rodar snapshot inicial:');
    console.log('      → node scripts/snapshot-initial.js');
    console.log('   2. Rodar snapshot final:');
    console.log('      → node scripts/snapshot-final.js');
    console.log('   3. Verificar distribuição de prêmios no banco');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERRO:', error);
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.$disconnect();
}

// Executar script
populateRound();
