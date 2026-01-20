/**
 * Script: Hard Reset All Active Rounds
 *
 * PROBLEMA:
 * Múltiplas rodadas com status ACTIVE estão competindo, bloqueando start-next-round.js
 *
 * SOLUÇÃO:
 * Encontra TODAS as competições ACTIVE e força status para COMPLETED
 * com endDate no passado, limpando a base de dados.
 *
 * Como executar:
 * node scripts/hard-reset-all-rounds.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function hardResetRounds() {
  console.log('🚀 ========================================');
  console.log('🚀 HARD RESET DE RODADAS ATIVAS');
  console.log('🚀 ========================================\n');

  try {
    const dateInThePast = new Date('2025-11-15T00:00:00Z'); // Data no passado

    // ============================================
    // ETAPA 1: Encontrar todas as rodadas ATIVAS
    // ============================================
    console.log('📋 ETAPA 1: Buscando rodadas ATIVAS...');

    const activeCompetitions = await prisma.competition.findMany({
      where: { status: 'ACTIVE' },
      include: {
        competitionTokens: true
      }
    });

    console.log(`🔍 Encontradas ${activeCompetitions.length} rodada(s) ATIVA(s)\n`);

    if (activeCompetitions.length === 0) {
      console.log('✅ Nenhuma rodada ATIVA encontrada.');
      console.log('ℹ️  A base de dados já está limpa.');
      console.log('ℹ️  Você pode executar start-next-round.js para criar a primeira rodada.\n');
      return;
    }

    // ============================================
    // ETAPA 2: Listar rodadas que serão finalizadas
    // ============================================
    console.log('📋 ETAPA 2: Listando rodadas que serão finalizadas:\n');

    activeCompetitions.forEach((comp, index) => {
      console.log(`   ${index + 1}. ID: ${comp.id}`);
      console.log(`      Nome: ${comp.name || 'Sem nome'}`);
      console.log(`      Início: ${comp.startDate?.toISOString() || 'N/A'}`);
      console.log(`      Fim: ${comp.endDate?.toISOString() || 'N/A'}`);
      console.log(`      Tokens: ${comp.competitionTokens.length}`);
      console.log('');
    });

    // ============================================
    // ETAPA 3: Finalizar todas as rodadas
    // ============================================
    console.log(`📋 ETAPA 3: Finalizando ${activeCompetitions.length} rodada(s)...\n`);

    let completedCount = 0;

    for (const comp of activeCompetitions) {
      console.log(`   ⏳ Finalizando rodada ${comp.id}...`);

      await prisma.competition.update({
        where: { id: comp.id },
        data: {
          status: 'COMPLETED',
          endDate: dateInThePast
        }
      });

      completedCount++;
      console.log(`   ✅ Rodada ${comp.id} marcada como COMPLETED`);
    }

    console.log('');

    // ============================================
    // ETAPA 4: Verificar resultado
    // ============================================
    console.log('📋 ETAPA 4: Verificando resultado...\n');

    const remainingActive = await prisma.competition.findMany({
      where: { status: 'ACTIVE' }
    });

    if (remainingActive.length === 0) {
      console.log('✅ Verificação: Nenhuma rodada ATIVA restante no banco');
    } else {
      console.warn(`⚠️ ATENÇÃO: Ainda existem ${remainingActive.length} rodada(s) ATIVA(s)!`);
      console.warn('   Pode ser necessário executar o script novamente.');
    }

    console.log('');

    // ============================================
    // RESUMO FINAL
    // ============================================
    console.log('✅ ========================================');
    console.log('✅ HARD RESET CONCLUÍDO COM SUCESSO');
    console.log('✅ ========================================');
    console.log(`📊 Rodadas finalizadas: ${completedCount}`);
    console.log(`📊 Rodadas ATIVAS restantes: ${remainingActive.length}`);
    console.log(`📊 Data de término definida: ${dateInThePast.toISOString()}`);
    console.log('\n🚀 PRÓXIMO PASSO:');
    console.log('   Execute: node scripts/start-next-round.js');
    console.log('   O script v3 irá criar uma nova rodada ACTIVE com Top 100 fresco.\n');

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ ERRO AO EXECUTAR HARD RESET');
    console.error('❌ ========================================');
    console.error(error);
    console.error('');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
hardResetRounds()
  .then(() => {
    console.log('✅ Script finalizado com sucesso\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  });
