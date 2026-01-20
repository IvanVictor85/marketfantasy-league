/**
 * Script: Corrigir Competição Presa (Stuck)
 *
 * PROBLEMA:
 * - O script v1 marcou uma rodada como COMPLETED prematuramente
 * - Criou uma nova rodada ACTIVE com 0 tokens (ID: cmi15t1rz0001nnf8mee9okmm)
 * - Isso impede o script v2 de funcionar corretamente
 *
 * SOLUÇÃO:
 * 1. Apaga a rodada ATIVA "má" (com 0 tokens)
 * 2. Reverte a rodada anterior para ATIVA
 * 3. Define a endDate da rodada anterior para o PASSADO
 * 4. Isso permite que o script v2 processe corretamente
 *
 * Como executar:
 * node scripts/fix-stuck-competition.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// IDs das rodadas problemáticas
const BROKEN_ACTIVE_COMPETITION_ID = 'cmi15t1rz0001nnf8mee9okmm'; // Rodada "má" com 0 tokens
const PREVIOUS_GOOD_COMPETITION_ID = 'cmi13u07h0001lszqabcx5hg0'; // Rodada "boa" marcada como COMPLETED

async function fixStuckCompetition() {
  console.log('🚀 ========================================');
  console.log('🚀 CORRIGIR ESTADO PRESO DA BASE DE DADOS');
  console.log('🚀 ========================================\n');

  try {
    // ============================================
    // ETAPA 1: Verificar estado atual
    // ============================================
    console.log('📋 ETAPA 1: Verificando estado atual...\n');

    const brokenCompetition = await prisma.competition.findUnique({
      where: { id: BROKEN_ACTIVE_COMPETITION_ID },
      include: {
        competitionTokens: true
      }
    });

    const goodCompetition = await prisma.competition.findUnique({
      where: { id: PREVIOUS_GOOD_COMPETITION_ID },
      include: {
        competitionTokens: true
      }
    });

    if (!brokenCompetition) {
      console.log('⚠️ Rodada "má" não encontrada. Talvez já tenha sido apagada?');
    } else {
      console.log('🔍 Rodada "má" encontrada:');
      console.log(`   ID: ${brokenCompetition.id}`);
      console.log(`   Status: ${brokenCompetition.status}`);
      console.log(`   Tokens: ${brokenCompetition.competitionTokens.length}`);
      console.log(`   Início: ${brokenCompetition.startDate?.toISOString()}`);
      console.log(`   Fim: ${brokenCompetition.endDate?.toISOString()}\n`);
    }

    if (!goodCompetition) {
      throw new Error('❌ Rodada "boa" não encontrada! ID pode estar incorreto.');
    }

    console.log('🔍 Rodada "boa" encontrada:');
    console.log(`   ID: ${goodCompetition.id}`);
    console.log(`   Status: ${goodCompetition.status}`);
    console.log(`   Tokens: ${goodCompetition.competitionTokens.length}`);
    console.log(`   Início: ${goodCompetition.startDate?.toISOString()}`);
    console.log(`   Fim: ${goodCompetition.endDate?.toISOString()}\n`);

    // ============================================
    // ETAPA 2: Apagar rodada "má"
    // ============================================
    if (brokenCompetition) {
      console.log('📋 ETAPA 2: Apagando rodada ATIVA "má"...\n');

      // Primeiro, apagar todos os CompetitionTokens relacionados (se houver)
      const deletedTokens = await prisma.competitionToken.deleteMany({
        where: { competitionId: BROKEN_ACTIVE_COMPETITION_ID }
      });
      console.log(`   ✅ ${deletedTokens.count} token(s) relacionado(s) apagado(s)`);

      // Depois, apagar a Competition
      await prisma.competition.delete({
        where: { id: BROKEN_ACTIVE_COMPETITION_ID }
      });
      console.log(`   ✅ Rodada "má" (${BROKEN_ACTIVE_COMPETITION_ID}) apagada\n`);
    } else {
      console.log('📋 ETAPA 2: Rodada "má" já não existe. Pulando...\n');
    }

    // ============================================
    // ETAPA 3: Reverter rodada "boa" para ACTIVE
    // ============================================
    console.log('📋 ETAPA 3: Revertendo rodada "boa" para ACTIVE...\n');

    // Definir endDate para o passado (15 de Novembro de 2025, 00:00 UTC)
    const dateInThePast = new Date('2025-11-15T00:00:00Z');
    console.log(`   🕐 Definindo endDate para: ${dateInThePast.toISOString()}`);

    await prisma.competition.update({
      where: { id: PREVIOUS_GOOD_COMPETITION_ID },
      data: {
        status: 'ACTIVE',
        endDate: dateInThePast
      }
    });

    console.log(`   ✅ Rodada "boa" (${PREVIOUS_GOOD_COMPETITION_ID}) definida como ACTIVE`);
    console.log(`   ✅ endDate movida para o PASSADO\n`);

    // ============================================
    // ETAPA 4: Verificar resultado final
    // ============================================
    console.log('📋 ETAPA 4: Verificando resultado final...\n');

    const updatedCompetition = await prisma.competition.findUnique({
      where: { id: PREVIOUS_GOOD_COMPETITION_ID },
      include: {
        competitionTokens: true
      }
    });

    console.log('🔍 Estado final da rodada "boa":');
    console.log(`   ID: ${updatedCompetition.id}`);
    console.log(`   Status: ${updatedCompetition.status}`);
    console.log(`   Tokens: ${updatedCompetition.competitionTokens.length}`);
    console.log(`   Início: ${updatedCompetition.startDate?.toISOString()}`);
    console.log(`   Fim: ${updatedCompetition.endDate?.toISOString()}`);

    const now = new Date();
    const hasEnded = updatedCompetition.endDate && updatedCompetition.endDate < now;
    console.log(`   Terminou? ${hasEnded ? '✅ SIM (no passado)' : '❌ NÃO (ainda no futuro)'}\n`);

    // ============================================
    // RESUMO FINAL
    // ============================================
    console.log('✅ ========================================');
    console.log('✅ CORREÇÃO CONCLUÍDA COM SUCESSO');
    console.log('✅ ========================================');
    console.log(`📊 Rodada "má" (0 tokens): APAGADA`);
    console.log(`📊 Rodada "boa": REVERTIDA para ACTIVE`);
    console.log(`📊 Tokens disponíveis: ${updatedCompetition.competitionTokens.length}`);
    console.log(`📊 endDate no passado: ${hasEnded ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log('\n🚀 PRÓXIMO PASSO:');
    console.log('   Execute: node scripts/start-next-round.js');
    console.log('   O script v2 irá:');
    console.log('   1. Detectar que a rodada ACTIVE terminou');
    console.log('   2. Marcá-la como COMPLETED');
    console.log('   3. Buscar Top 100 fresco da CoinGecko');
    console.log('   4. Criar nova rodada ACTIVE com tokens atualizados\n');

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ ERRO AO CORRIGIR ESTADO PRESO');
    console.error('❌ ========================================');
    console.error(error);
    console.error('');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
fixStuckCompetition()
  .then(() => {
    console.log('✅ Script finalizado com sucesso\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  });
