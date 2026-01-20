const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Simula a lógica do frontend para calcular o estado da competição
 */
function getCompetitionState(status, startDate, endDate) {
  if (!status || !startDate || !endDate) {
    return 'UNKNOWN';
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Regra 1: Rodada Finalizada (COMPLETED ou passou da endDate)
  if (status === 'COMPLETED' || now > end) {
    return 'FINISHED';
  }

  // Regra 2: Rodada em Andamento (entre startDate e endDate)
  if (status === 'ACTIVE' && now >= start && now <= end) {
    return 'LOCKED';
  }

  // Regra 3: Draft Aberto (ACTIVE mas antes de startDate)
  if (status === 'ACTIVE' && now < start) {
    return 'DRAFT_OPEN';
  }

  // Regra 4: PENDING (competição criada mas ainda não ativa)
  if (status === 'PENDING') {
    return 'DRAFT_OPEN';
  }

  return 'UNKNOWN';
}

async function testDraftLogic() {
  console.log('🧪 Testando Nova Lógica de Draft Aberto\n');
  console.log('📅 Data/Hora Atual:', new Date().toISOString());
  console.log('─'.repeat(80));

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

  console.log('\n📊 Competição ACTIVE Mais Recente:');
  console.log(`   ID: ${activeCompetition.id}`);
  console.log(`   Status: ${activeCompetition.status}`);
  console.log(`   Start Date: ${activeCompetition.startDate?.toISOString() || 'null'}`);
  console.log(`   End Date: ${activeCompetition.endDate?.toISOString() || 'null'}`);

  // Calcular estado
  const state = getCompetitionState(
    activeCompetition.status,
    activeCompetition.startDate,
    activeCompetition.endDate
  );

  console.log('\n🎯 Estado Calculado:', state);
  console.log('─'.repeat(80));

  // Explicar o estado
  console.log('\n📖 Explicação:\n');

  if (state === 'DRAFT_OPEN') {
    console.log('✅ DRAFT ABERTO');
    console.log('   → Competição está ACTIVE mas ainda não começou (antes de startDate)');
    console.log('   → Usuários PODEM se inscrever e pagar a taxa de entrada');
    console.log('   → Botão: "Entrar na Liga (X SOL)" - HABILITADO');

    const timeToLock = new Date(activeCompetition.startDate).getTime() - new Date().getTime();
    const hoursToLock = Math.floor(timeToLock / (1000 * 60 * 60));
    const minutesToLock = Math.floor((timeToLock % (1000 * 60 * 60)) / (1000 * 60));
    console.log(`   → Times serão trancados em: ${hoursToLock}h ${minutesToLock}m`);

  } else if (state === 'LOCKED') {
    console.log('🔒 TIMES TRANCADOS');
    console.log('   → Competição em andamento (entre startDate e endDate)');
    console.log('   → Usuários NÃO podem mais se inscrever');
    console.log('   → Botão: "🔒 Times Trancados!" - DESABILITADO');

  } else if (state === 'FINISHED') {
    console.log('🏁 RODADA FINALIZADA');
    console.log('   → Competição terminou (após endDate ou status COMPLETED)');
    console.log('   → Aguardando distribuição de prêmios');
    console.log('   → Botão: "Liga Finalizada" - DESABILITADO');

  } else {
    console.log('❓ ESTADO DESCONHECIDO');
    console.log('   → Dados incompletos ou inconsistentes');
    console.log('   → Botão: "Aguardando..." - DESABILITADO');
  }

  console.log('\n─'.repeat(80));
  console.log('\n🎉 Se o estado é DRAFT_OPEN, o bug está RESOLVIDO!');
  console.log('   O usuário agora deve ver o botão "Entrar na Liga" HABILITADO');
  console.log('   em vez de "Liga Finalizada".\n');

  await prisma.$disconnect();
}

testDraftLogic();
