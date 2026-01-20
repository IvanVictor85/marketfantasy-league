/**
 * 🎲 SCRIPT: Popular Rodada 1 com Times Aleatórios
 *
 * O que faz:
 * 1. Busca todos os usuários cadastrados
 * 2. Identifica a Rodada 1 (primeira competição)
 * 3. Cria times aleatórios para cada usuário
 * 4. Garante 10 tokens únicos por time
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Função para gerar array de 10 tokens únicos aleatórios
function getRandomTokens(availableTokens, count = 10) {
  const shuffled = [...availableTokens].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Nomes aleatórios para times
const teamNames = [
  'Crypto Warriors', 'Moon Shooters', 'Diamond Hands', 'HODL Heroes',
  'Whale Watchers', 'Pump Squad', 'Bull Runners', 'Bear Hunters',
  'Token Titans', 'DeFi Legends', 'NFT Ninjas', 'Satoshi Squad',
  'Lambo Dreamers', 'Rug Pull Survivors', 'Gas Fee Evaders'
];

function getRandomTeamName() {
  return teamNames[Math.floor(Math.random() * teamNames.length)];
}

async function main() {
  console.log('🎲 ========================================');
  console.log('🎲 POPULANDO RODADA 1 COM TIMES ALEATÓRIOS');
  console.log('🎲 ========================================\n');

  // ============================================
  // ETAPA 1: Buscar usuários cadastrados
  // ============================================
  console.log('👥 ETAPA 1: Buscando usuários cadastrados...');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      publicKey: true,
      username: true
    }
  });

  console.log(`✅ ${users.length} usuário(s) encontrado(s):\n`);
  users.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.username || user.email} (${user.id})`);
  });

  if (users.length === 0) {
    console.log('❌ Nenhum usuário encontrado. Cadastre usuários primeiro.');
    return;
  }

  // ============================================
  // ETAPA 2: Identificar Rodada 1
  // ============================================
  console.log('\n📅 ETAPA 2: Identificando Rodada 1...');

  // Buscar a liga principal (primeira liga ou por nome)
  const mainLeague = await prisma.league.findFirst({
    orderBy: {
      createdAt: 'asc'
    }
  });

  if (!mainLeague) {
    console.log('❌ Liga principal não encontrada');
    return;
  }

  console.log(`✅ Liga encontrada: ${mainLeague.name} (${mainLeague.id})`);

  // Buscar todas as competições da liga, ordenadas por data de início
  const competitions = await prisma.competition.findMany({
    where: {
      leagueId: mainLeague.id
    },
    orderBy: {
      startDate: 'asc'
    },
    include: {
      competitionTokens: true
    }
  });

  if (competitions.length === 0) {
    console.log('❌ Nenhuma competição encontrada. Crie rodadas primeiro.');
    return;
  }

  // Rodada 1 = primeira competição
  const round1 = competitions[0];

  console.log(`✅ Rodada 1 identificada:`);
  console.log(`   ID: ${round1.id}`);
  console.log(`   Status: ${round1.status}`);
  console.log(`   Início: ${round1.startDate.toISOString()}`);
  console.log(`   Fim: ${round1.endDate.toISOString()}`);
  console.log(`   Tokens disponíveis: ${round1.competitionTokens.length}`);

  if (round1.competitionTokens.length === 0) {
    console.log('❌ Rodada 1 não tem tokens disponíveis');
    return;
  }

  // ============================================
  // ETAPA 3: Verificar times existentes
  // ============================================
  console.log('\n🔍 ETAPA 3: Verificando times existentes...');

  const existingTeams = await prisma.userTeam.findMany({
    where: {
      competitionId: round1.id
    },
    include: {
      user: {
        select: {
          email: true,
          username: true
        }
      }
    }
  });

  // Criar lista de usuários que JÁ tem time
  const usersWithTeams = new Set(existingTeams.map(t => t.userId));

  if (existingTeams.length > 0) {
    console.log(`⚠️  ${existingTeams.length} time(s) já cadastrado(s):`);
    existingTeams.forEach((team, i) => {
      console.log(`   ${i + 1}. ${team.user.username || team.user.email} - ${team.teamName}`);
    });
    console.log('\n✅ Vou criar times apenas para usuários SEM time ainda...\n');
  } else {
    console.log('✅ Nenhum time cadastrado ainda. Prosseguindo...');
  }

  // Filtrar apenas usuários SEM time
  const usersWithoutTeams = users.filter(u => !usersWithTeams.has(u.id));

  if (usersWithoutTeams.length === 0) {
    console.log('✅ Todos os usuários já possuem time nesta rodada!');
    return;
  }

  console.log(`📊 ${usersWithoutTeams.length} usuário(s) sem time encontrado(s)`);

  // ============================================
  // ETAPA 4: Criar times aleatórios
  // ============================================
  console.log('\n🎲 ETAPA 4: Criando times aleatórios...\n');

  const availableTokenSymbols = round1.competitionTokens.map(t => t.symbol);
  let teamsCreated = 0;

  for (const user of usersWithoutTeams) {
    try {
      // Gerar 10 tokens aleatórios únicos
      const randomTokens = getRandomTokens(availableTokenSymbols, 10);

      // Gerar nome de time aleatório
      const teamName = `${user.username || 'Player'}'s ${getRandomTeamName()}`;

      console.log(`👤 Criando time para: ${user.username || user.email}`);
      console.log(`   Nome do time: ${teamName}`);
      console.log(`   Tokens: ${randomTokens.join(', ')}`);

      // Criar UserTeam
      const userTeam = await prisma.userTeam.create({
        data: {
          userId: user.id,
          competitionId: round1.id,
          teamName: teamName,
          players: randomTokens  // ✅ CORREÇÃO: Campo correto é players, não tokens
        }
      });

      console.log(`   ✅ Time criado: ${userTeam.id}\n`);
      teamsCreated++;

    } catch (error) {
      console.error(`   ❌ Erro ao criar time para ${user.email}:`, error.message);
    }
  }

  // ============================================
  // ETAPA 5: Resumo final
  // ============================================
  console.log('\n✅ ========================================');
  console.log('✅ POPULAÇÃO DE TIMES CONCLUÍDA');
  console.log('✅ ========================================');
  console.log(`📊 Usuários totais: ${users.length}`);
  console.log(`📊 Times criados: ${teamsCreated}`);
  console.log(`📊 Rodada: ${round1.id}`);
  console.log(`📊 Status: ${round1.status}`);
  console.log('');

  // Buscar e mostrar todos os times criados
  const allTeams = await prisma.userTeam.findMany({
    where: {
      competitionId: round1.id
    },
    include: {
      user: {
        select: {
          email: true,
          username: true
        }
      }
    }
  });

  console.log('📋 Times cadastrados na Rodada 1:\n');
  allTeams.forEach((team, i) => {
    console.log(`${i + 1}. ${team.teamName}`);
    console.log(`   Jogador: ${team.user.username || team.user.email}`);
    console.log(`   Tokens: ${Array.isArray(team.players) ? team.players.join(', ') : JSON.stringify(team.players)}`);
    console.log('');
  });
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
