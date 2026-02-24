import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const seasons = await prisma.season.findMany({ orderBy: { createdAt: 'desc' } });
  console.log('📅 TEMPORADAS:');
  seasons.forEach(s => console.log('  -', s.name, '|', s.status));

  const comps = await prisma.competition.findMany({ 
    include: { season: true, league: true },
    orderBy: { startDate: 'asc' }
  });
  console.log('\n🏆 RODADAS (Season Alpha):');
  comps.filter(c => c.season?.name === 'Season Alpha').forEach(c => {
    const start = c.startDate ? new Date(c.startDate).toLocaleDateString('pt-BR') : 'N/A';
    const end = c.endDate ? new Date(c.endDate).toLocaleDateString('pt-BR') : 'N/A';
    console.log('  -', c.name, '|', start, '-', end, '|', c.status);
  });

  await prisma.$disconnect();
}
check();
