const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function postponeCompetition() {
  console.log('🔧 Adiando competição ativa para amanhã às 21h...\n');

  // Buscar competição ACTIVE
  const activeCompetition = await prisma.competition.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { startDate: 'desc' }
  });

  if (!activeCompetition) {
    console.log('❌ Nenhuma competição ACTIVE encontrada');
    await prisma.$disconnect();
    return;
  }

  console.log('📊 Competição atual:');
  console.log('   ID:', activeCompetition.id);
  console.log('   Nome:', activeCompetition.name);
  console.log('   Start atual:', activeCompetition.startDate);
  console.log('   End atual:', activeCompetition.endDate);

  // Calcular nova data: amanhã às 21h (horário de Brasília UTC-3)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(21, 0, 0, 0); // 21h local

  // Manter a mesma duração (endDate - startDate)
  const currentStart = new Date(activeCompetition.startDate);
  const currentEnd = new Date(activeCompetition.endDate);
  const duration = currentEnd - currentStart;

  const newEndDate = new Date(tomorrow.getTime() + duration);

  console.log('\n📅 Novas datas:');
  console.log('   Novo Start:', tomorrow.toISOString());
  console.log('   Novo End:', newEndDate.toISOString());

  // Atualizar competição
  await prisma.competition.update({
    where: { id: activeCompetition.id },
    data: {
      startDate: tomorrow,
      endDate: newEndDate
    }
  });

  console.log('\n✅ Competição adiada com sucesso!');

  // Verificar
  const updated = await prisma.competition.findUnique({
    where: { id: activeCompetition.id }
  });

  console.log('\n📋 Confirmação:');
  console.log('   Start:', updated.startDate);
  console.log('   End:', updated.endDate);
  console.log('   Status:', updated.status);

  await prisma.$disconnect();
}

postponeCompetition();
