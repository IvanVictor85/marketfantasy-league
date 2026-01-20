const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserEnrollments() {
  const user = await prisma.user.findUnique({
    where: { email: 'pretimaoairdrops@gmail.com' },
    select: { id: true, username: true }
  });

  if (!user) {
    console.log('❌ Usuário não encontrado');
    return;
  }

  console.log('👤 Usuário:', user.username, '\n');

  // Buscar inscrições
  const entries = await prisma.leagueEntry.findMany({
    where: {
      userId: user.id,
      leagueId: 'cmh3qcrw80000cjvdrwtvt65i'
    }
  });

  console.log('📝 Inscrições (LeagueEntry):', entries.length);
  console.log('Dados brutos:', JSON.stringify(entries, null, 2));

  for (const entry of entries) {
    if (!entry.competitionId) {
      console.log(`  - [SEM COMPETITION ID]: ${entry.status} (leagueId: ${entry.leagueId})`);
      continue;
    }
    const comp = await prisma.competition.findUnique({
      where: { id: entry.competitionId },
      select: { name: true }
    });
    console.log(`  - ${comp?.name || entry.competitionId}: ${entry.status}`);
  }

  console.log();

  // Buscar times criados
  const teams = await prisma.userTeam.findMany({
    where: { userId: user.id }
  });

  console.log('🎮 Times (UserTeam):', teams.length);
  for (const team of teams) {
    const comp = await prisma.competition.findUnique({
      where: { id: team.competitionId },
      select: { name: true, status: true }
    });
    console.log(`  - ${comp?.name}: ${team.teamName} (${team.players.length} tokens) - Status comp: ${comp?.status}`);
  }

  await prisma.$disconnect();
}

checkUserEnrollments().catch(console.error);
