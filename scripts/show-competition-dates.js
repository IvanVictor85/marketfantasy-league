const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const competitions = await prisma.competition.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        league: {
          select: { name: true }
        },
        _count: {
          select: { userTeams: true }
        }
      }
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    RODADAS CADASTRADAS');
    console.log('═══════════════════════════════════════════════════════════\n');

    competitions.forEach((c, i) => {
      const start = c.startDate ? new Date(c.startDate) : null;
      const end = c.endDate ? new Date(c.endDate) : null;
      const created = new Date(c.createdAt);

      console.log(`📍 ${c.name || 'Sem nome'}`);
      console.log('   Liga:', c.league?.name || 'N/A');
      console.log('   Status:', c.status);
      console.log('   Times:', c._count.userTeams);
      console.log('   Criada em:', created.toLocaleString('pt-BR'));

      if (start && end) {
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        console.log('   Início:', start.toLocaleDateString('pt-BR'), 'às', start.toLocaleTimeString('pt-BR'));
        console.log('   Fim:', end.toLocaleDateString('pt-BR'), 'às', end.toLocaleTimeString('pt-BR'));
        console.log('   Duração:', days, 'dias');

        // Verificar se está no passado, presente ou futuro
        const now = new Date();
        if (now < start) {
          const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          console.log('   ⏳ Começa em:', daysUntil, 'dias');
        } else if (now >= start && now <= end) {
          console.log('   🔴 EM ANDAMENTO');
        } else {
          const daysAgo = Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
          console.log('   ✅ Finalizada há:', daysAgo, 'dias');
        }
      } else {
        console.log('   Datas: não definidas');
      }

      console.log('   ID:', c.id.substring(0, 25) + '...');
      console.log('');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
