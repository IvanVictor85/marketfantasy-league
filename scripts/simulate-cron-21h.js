/**
 * 🕐 SIMULADOR DE CRON ÀS 21H (Ambiente Local)
 *
 * Este script simula o comportamento dos cron jobs que rodam às 21h:
 * - Verifica competições que devem iniciar/finalizar
 * - Executa snapshots automaticamente
 * - Útil para testar localmente sem esperar até às 21h
 *
 * Uso:
 *   node scripts/simulate-cron-21h.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🕐 ========================================');
  console.log('🕐 SIMULADOR DE CRON ÀS 21H');
  console.log('🕐 ========================================\n');

  const now = new Date();
  console.log(`⏰ Horário atual: ${now.toLocaleString('pt-BR')}\n`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // ============================================
  // ETAPA 1: VERIFICAR COMPETIÇÕES PARA INICIAR
  // ============================================
  console.log('📋 ETAPA 1: Verificando competições para INICIAR (Domingo 21h)...\n');

  const pendingCompetitions = await prisma.competition.findMany({
    where: { status: 'PENDING' },
    include: {
      league: { select: { name: true } },
      _count: { select: { userTeams: true } }
    },
    orderBy: { startDate: 'asc' }
  });

  console.log(`📊 Encontradas ${pendingCompetitions.length} competições PENDING:\n`);

  if (pendingCompetitions.length === 0) {
    console.log('   ℹ️  Nenhuma competição pendente para iniciar\n');
  } else {
    pendingCompetitions.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name || `Rodada ${i + 1}`}`);
      console.log(`      ID: ${c.id}`);
      console.log(`      Times: ${c._count.userTeams}`);
      console.log(`      Início previsto: ${c.startDate.toLocaleString('pt-BR')}`);
      console.log('');
    });

    // Perguntar qual iniciar
    console.log('❓ Deseja iniciar alguma competição?\n');
    console.log('Opções:');
    pendingCompetitions.forEach((c, i) => {
      console.log(`   ${i + 1}) Iniciar "${c.name || `Rodada ${i + 1}`}" (${c._count.userTeams} times)`);
    });
    console.log('   0) Pular para próxima etapa\n');

    // Para automação, vamos iniciar a primeira com times
    const toStart = pendingCompetitions.find(c => c._count.userTeams > 0);

    if (toStart) {
      console.log(`🚀 Iniciando automaticamente: ${toStart.name || 'Rodada'} (${toStart._count.userTeams} times)...\n`);

      try {
        const response = await fetch(`${appUrl}/api/competition/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitionId: toStart.id })
        });

        const data = await response.json();

        if (response.ok) {
          console.log('✅ Competição iniciada com sucesso!');
          console.log(`   Status: ${data.competition?.status || 'N/A'}`);
          console.log(`   Tokens capturados: ${data.snapshot?.tokensCount || 0}`);
          if (data.snapshot?.sample) {
            console.log('\n   📸 Amostra de preços iniciais:');
            data.snapshot.sample.forEach((token) => {
              console.log(`      ${token.symbol}: $${token.price}`);
            });
          }
          console.log('');
        } else {
          console.log('❌ Erro ao iniciar competição:');
          console.log(`   ${data.error || 'Erro desconhecido'}`);
          if (data.details) console.log(`   Detalhes: ${data.details}`);
          console.log('');
        }
      } catch (error) {
        console.log('❌ Erro de conexão:');
        console.log(`   ${error.message}`);
        console.log('   ⚠️  Verifique se o servidor está rodando (npm run dev)\n');
      }
    }
  }

  // ============================================
  // ETAPA 2: VERIFICAR COMPETIÇÕES PARA FINALIZAR
  // ============================================
  console.log('📋 ETAPA 2: Verificando competições para FINALIZAR (Sexta 21h)...\n');

  const activeCompetitions = await prisma.competition.findMany({
    where: { status: 'ACTIVE' },
    include: {
      league: { select: { name: true } },
      _count: { select: { userTeams: true } }
    },
    orderBy: { endDate: 'asc' }
  });

  console.log(`📊 Encontradas ${activeCompetitions.length} competições ACTIVE:\n`);

  if (activeCompetitions.length === 0) {
    console.log('   ℹ️  Nenhuma competição ativa para finalizar\n');
  } else {
    activeCompetitions.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name || `Rodada ${i + 1}`}`);
      console.log(`      ID: ${c.id}`);
      console.log(`      Times: ${c._count.userTeams}`);
      console.log(`      Fim previsto: ${c.endDate.toLocaleString('pt-BR')}`);
      console.log('');
    });

    // Perguntar qual finalizar
    console.log('❓ Deseja finalizar alguma competição?\n');
    console.log('Opções:');
    activeCompetitions.forEach((c, i) => {
      console.log(`   ${i + 1}) Finalizar "${c.name || `Rodada ${i + 1}`}" (${c._count.userTeams} times)`);
    });
    console.log('   0) Não finalizar nenhuma\n');

    // Para automação, vamos finalizar a primeira
    const toEnd = activeCompetitions[0];

    if (toEnd) {
      console.log(`🏁 Finalizando automaticamente: ${toEnd.name || 'Rodada'} (${toEnd._count.userTeams} times)...\n`);

      try {
        const response = await fetch(`${appUrl}/api/competition/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitionId: toEnd.id })
        });

        const data = await response.json();

        if (response.ok) {
          console.log('✅ Competição finalizada com sucesso!');
          console.log(`   Status: ${data.competition?.status || 'N/A'}`);
          console.log(`   Times avaliados: ${data.scores?.teamsScored || 0}`);

          if (data.winners && data.winners.length > 0) {
            console.log('\n   🏆 TOP 3:');
            data.winners.forEach((winner) => {
              console.log(`      ${winner.position}º - ${winner.teamName}`);
              console.log(`         Score: ${winner.totalScore}%`);
              console.log(`         Prêmio: ${winner.prize} SOL`);
            });
          }

          if (data.nextCompetition) {
            console.log('\n   📅 Próxima rodada criada:');
            console.log(`      ID: ${data.nextCompetition.id}`);
            console.log(`      Status: ${data.nextCompetition.status}`);
          }
          console.log('');
        } else {
          console.log('❌ Erro ao finalizar competição:');
          console.log(`   ${data.error || 'Erro desconhecido'}`);
          if (data.details) console.log(`   Detalhes: ${data.details}`);
          console.log('');
        }
      } catch (error) {
        console.log('❌ Erro de conexão:');
        console.log(`   ${error.message}`);
        console.log('   ⚠️  Verifique se o servidor está rodando (npm run dev)\n');
      }
    }
  }

  // ============================================
  // RESUMO FINAL
  // ============================================
  console.log('✅ ========================================');
  console.log('✅ SIMULAÇÃO DE CRON CONCLUÍDA');
  console.log('✅ ========================================\n');

  console.log('📊 Status Atual das Rodadas:\n');

  const allCompetitions = await prisma.competition.findMany({
    orderBy: { startDate: 'asc' },
    include: {
      _count: { select: { userTeams: true } }
    }
  });

  allCompetitions.forEach((c, i) => {
    const statusIcon = c.status === 'COMPLETED' ? '✅' : c.status === 'ACTIVE' ? '🔵' : '⏳';
    console.log(`${statusIcon} ${c.name || `Rodada ${i + 1}`}: ${c.status} (${c._count.userTeams} times)`);
  });

  console.log('');
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
