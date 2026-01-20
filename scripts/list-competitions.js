const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Listando todas as competições/rodadas...\n');

    // Buscar todas as ligas
    const leagues = await prisma.league.findMany({
      select: {
        id: true,
        name: true
      }
    });

    for (const league of leagues) {
      console.log('═══════════════════════════════════════');
      console.log('📊 LIGA:', league.name);
      console.log('═══════════════════════════════════════\n');

      const competitions = await prisma.competition.findMany({
        where: { leagueId: league.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          _count: {
            select: {
              userTeams: true
            }
          }
        }
      });

      console.log('Total de rodadas:', competitions.length, '\n');

      competitions.forEach((c, i) => {
        console.log(`📍 Rodada ${competitions.length - i}`);
        console.log('  ID:', c.id.substring(0, 20) + '...');
        console.log('  Nome:', c.name || 'N/A');
        console.log('  Status:', c.status);
        console.log('  Times cadastrados:', c._count.userTeams);
        console.log('  Criada em:', new Date(c.createdAt).toLocaleString('pt-BR'));
        console.log('  Período:', c.startDate ? new Date(c.startDate).toLocaleDateString('pt-BR') : 'N/A', 'até', c.endDate ? new Date(c.endDate).toLocaleDateString('pt-BR') : 'N/A');
        console.log('');
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
