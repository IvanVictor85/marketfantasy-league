const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUserTeams() {
  try {
    console.log('🔍 Verificando dados de times por rodada...\n');

    // Buscar usuário atual (você pode mudar o email)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true
      },
      take: 5
    });

    console.log('👥 Usuários encontrados:');
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.username || user.email || user.name} (${user.id})`);
    });
    console.log('');

    // Pegar o primeiro usuário para debug
    const userId = users[0]?.id;
    if (!userId) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }

    console.log(`\n📊 Verificando times do usuário: ${users[0].username || users[0].email}\n`);

    // Buscar todos os UserTeams deste usuário
    const userTeams = await prisma.userTeam.findMany({
      where: { userId },
      include: {
        competition: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            leagueId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total de times cadastrados: ${userTeams.length}\n`);

    if (userTeams.length === 0) {
      console.log('⚠️ Usuário não tem times em nenhuma rodada!');
      return;
    }

    userTeams.forEach((team, i) => {
      console.log(`${i + 1}. Competição: ${team.competition.name || 'Sem nome'}`);
      console.log(`   ID: ${team.competition.id}`);
      console.log(`   Status: ${team.competition.status}`);
      console.log(`   Liga: ${team.competition.leagueId}`);
      console.log(`   Pontos: ${team.totalPoints.toString()}`);
      console.log(`   Players: ${JSON.stringify(team.players)}`);
      console.log(`   Time Name: ${team.teamName || 'N/A'}`);
      console.log(`   Entry Fee Paid: ${team.entryFeePaid}`);
      console.log('');
    });

    // Verificar que liga tem mais times
    const leagueGroups = {};
    userTeams.forEach(team => {
      const leagueId = team.competition.leagueId;
      if (!leagueGroups[leagueId]) {
        leagueGroups[leagueId] = [];
      }
      leagueGroups[leagueId].push(team);
    });

    console.log('\n📋 Times por Liga:');
    for (const [leagueId, teams] of Object.entries(leagueGroups)) {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: { name: true }
      });
      console.log(`  Liga: ${league?.name || leagueId}`);
      console.log(`  Total de rodadas: ${teams.length}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserTeams();
