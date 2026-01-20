const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPaymentEntries() {
  console.log('🔍 Verificando entradas de pagamento...\n');

  const user = await prisma.user.findUnique({
    where: { email: 'pretimaoairdrops@gmail.com' },
    select: { id: true, username: true }
  });

  if (!user) {
    console.log('❌ Usuário não encontrado');
    return;
  }

  console.log(`👤 Usuário: ${user.username} (${user.id})\n`);

  // Buscar todas as entries do usuário
  const entries = await prisma.leagueEntry.findMany({
    where: {
      userId: user.id
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`📝 Total de LeagueEntry: ${entries.length}\n`);

  if (entries.length === 0) {
    console.log('⚠️ Nenhuma entrada encontrada. Usuário precisa se inscrever nas rodadas.\n');
  } else {
    console.log('Detalhes das entradas:\n');
    for (const entry of entries) {
      let compName = 'Sem competição';
      if (entry.competitionId) {
        const comp = await prisma.competition.findUnique({
          where: { id: entry.competitionId },
          select: { name: true, status: true }
        });
        compName = comp ? `${comp.name} (${comp.status})` : 'Competição não encontrada';
      }

      console.log(`✓ ${compName}`);
      console.log(`  Status: ${entry.status}`);
      console.log(`  CompetitionId: ${entry.competitionId || 'null'}`);
      console.log(`  LeagueId: ${entry.leagueId || 'null'}`);
      console.log(`  Criado em: ${entry.createdAt.toLocaleString('pt-BR')}`);
      console.log(`  Transaction: ${entry.transactionHash.substring(0, 20)}...`);
      console.log();
    }
  }

  // Buscar times
  const teams = await prisma.userTeam.findMany({
    where: { userId: user.id },
    include: {
      competition: {
        select: { name: true, status: true }
      }
    }
  });

  console.log(`🎮 Total de UserTeam: ${teams.length}\n`);

  for (const team of teams) {
    const hasEntry = entries.find(e => e.competitionId === team.competitionId);
    const status = hasEntry ? '✅ COM entrada' : '❌ SEM entrada';

    console.log(`${status} - ${team.competition?.name}: ${team.teamName}`);
    console.log(`  Tokens: ${team.players.length}`);
    console.log(`  CompetitionId: ${team.competitionId}`);
    if (!hasEntry) {
      console.log(`  ⚠️ PROBLEMA: Time sem LeagueEntry confirmada!`);
    }
    console.log();
  }

  await prisma.$disconnect();
}

verifyPaymentEntries().catch(console.error);
