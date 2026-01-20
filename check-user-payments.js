const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userEmail = 'pretimaoairdrops@gmail.com';

  // 1. Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email: userEmail }
  });

  if (!user) {
    console.log('❌ Usuário não encontrado');
    return;
  }

  console.log('✅ Usuário encontrado:', user.name, '(', user.id, ')');
  console.log('');

  // 2. Buscar todas as entradas de liga do usuário
  const leagueEntries = await prisma.leagueEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`📊 Total de entradas (LeagueEntry): ${leagueEntries.length}`);
  console.log('');

  for (const [i, entry] of leagueEntries.entries()) {
    // Buscar competição manualmente
    let competition = null;
    if (entry.competitionId) {
      competition = await prisma.competition.findUnique({
        where: { id: entry.competitionId }
      });
    }

    console.log(`${i+1}. ${competition?.name || 'Sem competição vinculada'}`);
    console.log(`   ID da Competição: ${entry.competitionId || 'N/A'}`);
    console.log(`   Status: ${entry.status}`);
    console.log(`   Valor Pago: ${entry.amountPaid} SOL`);
    console.log(`   Tx Hash: ${entry.transactionHash}`);
    console.log(`   Data: ${entry.createdAt.toLocaleString('pt-BR')}`);
    console.log('');
  }

  // 3. Buscar todos os times do usuário
  const userTeams = await prisma.userTeam.findMany({
    where: { userId: user.id },
    include: {
      competition: {
        select: {
          id: true,
          name: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`🎯 Total de times (UserTeam): ${userTeams.length}`);
  console.log('');

  userTeams.forEach((team, i) => {
    console.log(`${i+1}. ${team.competition?.name || 'Sem nome'} - ${team.teamName}`);
    console.log(`   ID da Competição: ${team.competitionId}`);
    console.log(`   Tokens: ${team.players.length}`);
    console.log(`   Data: ${team.createdAt.toLocaleString('pt-BR')}`);
    console.log('');
  });

  // 4. Listar todas as rodadas da liga principal
  console.log('📋 Rodadas da Liga Principal:');
  const competitions = await prisma.competition.findMany({
    where: { leagueId: 'cmh3qcrw80000cjvdrwtvt65i' },
    orderBy: { startDate: 'asc' }
  });

  for (const comp of competitions) {
    const hasEntry = leagueEntries.some(e => e.competitionId === comp.id);
    const hasTeam = userTeams.some(t => t.competitionId === comp.id);

    console.log('');
    console.log(`Rodada: ${comp.name} (${comp.status})`);
    console.log(`ID: ${comp.id}`);
    console.log(`Tem Entrada (LeagueEntry): ${hasEntry ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`Tem Time (UserTeam): ${hasTeam ? '✅ SIM' : '❌ NÃO'}`);
  }

  await prisma.$disconnect();
}

main();
