/**
 * 🔄 CORRIGE RODADA 2
 *
 * 1. Reverte status para PENDING
 * 2. Remove snapshot inicial
 * 3. Popula com times aleatórios
 * 4. Depois executar snapshot manualmente
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodada2Id = 'cmicaluov000410ouj4ywkwop';

// Nomes aleatórios para times
const teamNames = [
  'Blockchain Warriors', 'Crypto Legends', 'DeFi Dragons', 'NFT Ninjas',
  'Web3 Wolves', 'Token Titans', 'Smart Contract Stars', 'Digital Dolphins',
  'Chain Champions', 'Solana Sharks', 'Bitcoin Bulls', 'Ethereum Eagles',
  'Polygon Panthers', 'Avalanche Aces', 'Cardano Cardinals', 'Dogecoin Dogs',
  'Ripple Rockets', 'Litecoin Lions', 'Stellar Stingrays', 'Cosmos Comets',
  'Polkadot Pythons', 'Uniswap Unicorns', 'Aave Avengers', 'Link Leopards'
];

function getRandomTokens(availableTokens, count = 10) {
  const shuffled = [...availableTokens].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function main() {
  console.log('\n🔄 CORRIGINDO RODADA 2\n');
  console.log('═'.repeat(80));

  // ============================================================================
  // PASSO 1: REVERTER STATUS PARA PENDING
  // ============================================================================
  console.log('\n📝 PASSO 1: Revertendo status para PENDING...\n');

  const competition = await prisma.competition.update({
    where: { id: rodada2Id },
    data: { status: 'PENDING' }
  });

  console.log(`✅ Status atualizado: ${competition.status}`);

  // ============================================================================
  // PASSO 2: LIMPAR PREÇOS DO SNAPSHOT (se existirem)
  // ============================================================================
  console.log('\n🧹 PASSO 2: Limpando dados de snapshot...\n');

  const deleted = await prisma.competitionToken.updateMany({
    where: { competitionId: rodada2Id },
    data: {
      priceStart: null,
      priceStartDate: null,
      priceEnd: null,
      priceEndDate: null,
      percentChange: null
    }
  });

  console.log(`✅ ${deleted.count} tokens limpos`);

  // ============================================================================
  // PASSO 3: VERIFICAR TIMES EXISTENTES
  // ============================================================================
  console.log('\n📊 PASSO 3: Verificando times existentes...\n');

  const existingTeams = await prisma.userTeam.findMany({
    where: { competitionId: rodada2Id },
    include: { user: { select: { username: true, email: true } } }
  });

  console.log(`Times já cadastrados: ${existingTeams.length}`);
  existingTeams.forEach(t => {
    console.log(`   - ${t.teamName} (${t.user.username || t.user.email})`);
  });

  // ============================================================================
  // PASSO 4: BUSCAR USUÁRIOS SEM TIMES
  // ============================================================================
  console.log('\n👥 PASSO 4: Buscando usuários sem times...\n');

  const allUsers = await prisma.user.findMany({
    select: { id: true, username: true, email: true }
  });

  const usersWithTeams = new Set(existingTeams.map(t => t.userId));
  const usersWithoutTeams = allUsers.filter(u => !usersWithTeams.has(u.id));

  console.log(`Total de usuários: ${allUsers.length}`);
  console.log(`Usuários sem time na Rodada 2: ${usersWithoutTeams.length}`);

  // ============================================================================
  // PASSO 5: BUSCAR TOKENS DISPONÍVEIS
  // ============================================================================
  console.log('\n🪙 PASSO 5: Buscando tokens disponíveis...\n');

  const competitionTokens = await prisma.competitionToken.findMany({
    where: { competitionId: rodada2Id },
    select: { symbol: true }
  });

  const availableTokens = competitionTokens.map(ct => ct.symbol);
  console.log(`Tokens disponíveis: ${availableTokens.length}`);
  console.log(`Tokens: ${availableTokens.join(', ')}`);

  // ============================================================================
  // PASSO 6: CRIAR TIMES ALEATÓRIOS
  // ============================================================================
  console.log('\n🎲 PASSO 6: Criando times aleatórios...\n');

  let created = 0;
  const usedNames = new Set(existingTeams.map(t => t.teamName));

  for (const user of usersWithoutTeams) {
    // Escolher nome único
    let teamName;
    do {
      teamName = teamNames[Math.floor(Math.random() * teamNames.length)];
    } while (usedNames.has(teamName));
    usedNames.add(teamName);

    // Escolher 10 tokens aleatórios
    const randomTokens = getRandomTokens(availableTokens, 10);

    // Criar time
    const userTeam = await prisma.userTeam.create({
      data: {
        userId: user.id,
        competitionId: rodada2Id,
        teamName: teamName,
        players: randomTokens,
        totalPoints: 0
      }
    });

    console.log(`   ✅ ${teamName} (${user.username || user.email})`);
    console.log(`      Tokens: ${randomTokens.join(', ')}`);
    console.log('');

    created++;
  }

  console.log(`✅ ${created} times criados!`);

  // ============================================================================
  // RESUMO FINAL
  // ============================================================================
  console.log('\n═'.repeat(80));
  console.log('\n📊 RESUMO FINAL:\n');

  const finalTeams = await prisma.userTeam.findMany({
    where: { competitionId: rodada2Id }
  });

  console.log(`✅ Status da Rodada 2: PENDING`);
  console.log(`✅ Total de times: ${finalTeams.length}`);
  console.log(`✅ Times criados agora: ${created}`);
  console.log(`✅ Snapshot: LIMPO (pronto para ser executado)`);
  console.log('');
  console.log('💡 PRÓXIMO PASSO:');
  console.log('   Execute o snapshot inicial da Rodada 2:');
  console.log('   node scripts/manual-snapshot.js (opção START)');
  console.log('');
  console.log('═'.repeat(80));
  console.log('');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
