const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompetitions() {
  console.log('📋 Verificando estado das competições...\n');

  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      _count: {
        select: { competitionTokens: true }
      }
    }
  });

  console.log(`Total de competições (últimas 5):\n`);
  competitions.forEach((comp, i) => {
    console.log(`${i + 1}. ID: ${comp.id}`);
    console.log(`   Nome: ${comp.name || 'Sem nome'}`);
    console.log(`   Status: ${comp.status}`);
    console.log(`   Início: ${comp.startDate?.toISOString()}`);
    console.log(`   Fim: ${comp.endDate?.toISOString()}`);
    console.log(`   Tokens: ${comp._count.competitionTokens}`);
    console.log('');
  });

  const activeCount = await prisma.competition.count({
    where: { status: 'ACTIVE' }
  });

  console.log(`\n📊 Resumo:`);
  console.log(`   Competições ACTIVE: ${activeCount}`);

  await prisma.$disconnect();
}

checkCompetitions();
