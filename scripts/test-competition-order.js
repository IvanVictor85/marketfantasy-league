const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCompetitionOrder() {
  console.log('🔍 Testando ordenação de competições ACTIVE...\n');

  // Buscar liga
  const league = await prisma.league.findFirst({
    where: {
      name: 'Liga Principal MarketFantasy'
    },
    include: {
      competitions: {
        orderBy: { startDate: 'desc' }
      }
    }
  });

  console.log('📊 Competições (ordenadas por data, mais recente primeiro):\n');
  league.competitions.forEach((c, i) => {
    const isActive = c.status === 'ACTIVE' ? '✅' : '  ';
    const dateStr = c.startDate ? c.startDate.toISOString().split('T')[0] : 'SEM DATA';
    console.log(`${isActive} ${i + 1}. ${c.id.slice(-10)} | ${c.status.padEnd(10)} | ${dateStr}`);
  });

  // Teste da lógica corrigida
  console.log('\n🧪 Testando lógica corrigida (sort + find):\n');
  const sortedCompetitions = league.competitions.sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  const activeCompetition = sortedCompetitions.find(comp => comp.status === 'ACTIVE');

  if (activeCompetition) {
    console.log('✅ Competição ACTIVE mais recente encontrada:');
    console.log(`   ID: ${activeCompetition.id}`);
    console.log(`   Status: ${activeCompetition.status}`);
    console.log(`   Início: ${activeCompetition.startDate.toISOString()}`);
    console.log(`   Fim: ${activeCompetition.endDate.toISOString()}`);
    console.log(`\n🎯 Este é o ID correto que deve aparecer nos logs da API!`);
  } else {
    console.log('❌ Nenhuma competição ACTIVE encontrada');
  }

  await prisma.$disconnect();
}

testCompetitionOrder();
