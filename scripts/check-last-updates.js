const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Verificando últimas atualizações...\n');

    // Buscar competições recentes
    const competitions = await prisma.competition.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        league: {
          select: { name: true }
        }
      }
    });

    console.log('📊 ÚLTIMAS COMPETIÇÕES:');
    console.log('========================');
    competitions.forEach(c => {
      console.log('Liga:', c.league?.name || 'N/A');
      console.log('Status:', c.status);
      console.log('Criada:', c.createdAt);
      console.log('Atualizada:', c.updatedAt);
      console.log('Start:', c.startDate);
      console.log('End:', c.endDate);
      console.log('---');
    });

    // Buscar últimos times atualizados
    const recentTeams = await prisma.userTeam.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        teamName: true,
        totalPoints: true,
        updatedAt: true,
        createdAt: true,
        user: {
          select: { name: true }
        },
        competition: {
          select: {
            status: true,
            startDate: true,
            endDate: true
          }
        }
      }
    });

    console.log('\n⚽ ÚLTIMOS TIMES ATUALIZADOS:');
    console.log('============================');
    recentTeams.forEach(t => {
      console.log('Time:', t.teamName);
      console.log('Usuário:', t.user.name);
      console.log('Pontos:', t.totalPoints);
      console.log('Criado:', t.createdAt);
      console.log('Atualizado:', t.updatedAt);
      console.log('Comp Status:', t.competition?.status);
      console.log('---');
    });

    // Verificar se há competição ACTIVE agora
    const now = new Date();
    const activeComp = await prisma.competition.findFirst({
      where: {
        status: 'ACTIVE'
      },
      include: {
        league: { select: { name: true } }
      }
    });

    console.log('\n🎯 COMPETIÇÃO ATIVA AGORA:');
    console.log('==========================');
    if (activeComp) {
      console.log('Liga:', activeComp.league?.name);
      console.log('Status:', activeComp.status);
      console.log('Start:', activeComp.startDate);
      console.log('End:', activeComp.endDate);
      console.log('Hora atual:', now);
    } else {
      console.log('❌ Nenhuma competição ACTIVE no momento');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
