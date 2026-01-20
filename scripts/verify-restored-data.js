const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('🔍 Verificando dados restaurados...\n');

    // 1. Verificar Season
    const season = await prisma.season.findFirst({
      include: {
        competitions: {
          orderBy: { createdAt: 'asc' },
          include: {
            league: true,
            _count: {
              select: { userTeams: true }
            }
          }
        }
      }
    });

    if (season) {
      console.log(`✅ Temporada: ${season.name}`);
      console.log(`   Status: ${season.status}`);
      console.log(`   Início: ${new Date(season.startDate).toLocaleDateString()}`);
      console.log(`   Fim: ${new Date(season.endDate).toLocaleDateString()}\n`);

      // Agrupar competições por liga
      const leagueMap = new Map();
      for (const comp of season.competitions) {
        const leagueId = comp.league?.id || 'sem-liga';
        if (!leagueMap.has(leagueId)) {
          leagueMap.set(leagueId, {
            league: comp.league,
            competitions: []
          });
        }
        leagueMap.get(leagueId).competitions.push(comp);
      }

      // Mostrar ligas e suas rodadas
      for (const [leagueId, data] of leagueMap) {
        if (data.league) {
          console.log(`📊 Liga: ${data.league.name}`);
          console.log(`   Entry Fee: ${data.league.entryFee} SOL`);
          console.log(`   Rodadas:\n`);

          for (const comp of data.competitions) {
            console.log(`   🎯 ${comp.name || 'Rodada'}`);
            console.log(`      Status: ${comp.status}`);
            console.log(`      Participantes: ${comp._count.userTeams}`);
            console.log(`      Início: ${new Date(comp.startDate).toLocaleDateString()}`);
            console.log(`      Fim: ${new Date(comp.endDate).toLocaleDateString()}\n`);
          }
        }
      }
    }

    // 2. Verificar total de usuários
    const userCount = await prisma.user.count();
    console.log(`\n👥 Total de usuários: ${userCount}`);

    // 3. Verificar total de times
    const teamCount = await prisma.userTeam.count();
    console.log(`🏆 Total de times: ${teamCount}`);

    // 4. Verificar league entries
    const entryCount = await prisma.leagueEntry.count();
    console.log(`🎫 Total de league entries: ${entryCount}`);

    // 5. Verificar UserTeams por competição
    console.log('\n📋 Distribuição de times por rodada:');
    const teamsByComp = await prisma.userTeam.groupBy({
      by: ['competitionId'],
      _count: true
    });

    for (const group of teamsByComp) {
      const comp = await prisma.competition.findUnique({
        where: { id: group.competitionId },
        select: { name: true, status: true }
      });
      console.log(`   ${comp?.name || 'Rodada'} (${comp?.status}): ${group._count} participantes`);
    }

    console.log('\n✅ Verificação concluída!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
