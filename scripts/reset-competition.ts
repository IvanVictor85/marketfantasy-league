/**
 * Script de Reset de Competição
 *
 * 🚨 SCRIPT DE EMERGÊNCIA - ADMIN ONLY
 *
 * Executa o reset completo do estado da competição.
 * Usado para corrigir estados de "limbo" após refatorações.
 *
 * Uso: npx tsx scripts/reset-competition.ts
 */

import { prisma } from '../src/lib/prisma';
import { getTop100Tokens } from '../src/lib/services/coingecko.service';

async function resetCompetition() {
  const startTime = Date.now();

  try {
    console.log('🚨 ========================================');
    console.log('🚨 ADMIN: RESET DE COMPETIÇÃO INICIADO');
    console.log('🚨 ========================================\n');

    // ============================================
    // ETAPA 1: LIMPAR ESTADO ANTIGO
    // ============================================
    console.log('🗑️  ETAPA 1: Limpando competições antigas...');

    const competitionsCount = await prisma.competition.count();
    console.log(`📊 Competições encontradas: ${competitionsCount}`);

    if (competitionsCount > 0) {
      await prisma.competition.deleteMany({});
      console.log(`✅ ${competitionsCount} competição(ões) deletada(s)`);
      console.log('✅ CompetitionTokens deletados automaticamente (cascade)\n');
    } else {
      console.log('ℹ️  Nenhuma competição para deletar\n');
    }

    // ============================================
    // ETAPA 2: BUSCAR TOP 100 DA COINGECKO
    // ============================================
    console.log('🌐 ETAPA 2: Buscando Top 100 tokens da CoinGecko...');

    const top100Tokens = await getTop100Tokens();
    console.log(`✅ ${top100Tokens.length} tokens obtidos da CoinGecko\n`);

    // ============================================
    // ETAPA 3: CALCULAR DATAS DA PRÓXIMA RODADA
    // ============================================
    console.log('📅 ETAPA 3: Calculando datas da próxima rodada...');

    const now = new Date();
    console.log(`⏰ Horário atual: ${now.toISOString()}`);

    // Próximo Domingo às 21h (BRT)
    const nextSunday = new Date(now);
    const dayOfWeek = now.getDay(); // 0 = Domingo, 6 = Sábado
    const daysUntilSunday = dayOfWeek === 0 ? 7 : (7 - dayOfWeek);

    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(21, 0, 0, 0); // 21:00:00

    // Próxima Sexta às 21h (5 dias após domingo)
    const nextFriday = new Date(nextSunday);
    nextFriday.setDate(nextSunday.getDate() + 5);

    console.log(`📅 Início (Domingo 21h): ${nextSunday.toISOString()}`);
    console.log(`📅 Fim (Sexta 21h): ${nextFriday.toISOString()}\n`);

    // ============================================
    // ETAPA 4: CRIAR NOVA COMPETIÇÃO (PENDING)
    // ============================================
    console.log('🏗️  ETAPA 4: Criando nova competição...');

    const mainLeague = await prisma.league.findFirst({
      where: {
        leagueType: 'MAIN',
        isActive: true
      }
    });

    if (!mainLeague) {
      throw new Error('Liga principal não encontrada');
    }

    console.log(`✅ Liga encontrada: ${mainLeague.name} (${mainLeague.id})`);

    const newCompetition = await prisma.competition.create({
      data: {
        leagueId: mainLeague.id,
        startTime: nextSunday,
        endTime: nextFriday,
        status: 'pending', // Draft aberto
        prizePool: 0,
        distributed: false
      }
    });

    console.log(`✅ Competição criada: ${newCompetition.id}`);
    console.log(`   Status: ${newCompetition.status}`);
    console.log(`   Início: ${newCompetition.startTime.toISOString()}`);
    console.log(`   Fim: ${newCompetition.endTime.toISOString()}\n`);

    // ============================================
    // ETAPA 5: SALVAR CARDÁPIO DE TOKENS
    // ============================================
    console.log('💾 ETAPA 5: Salvando cardápio de tokens...');

    const tokensToCreate = top100Tokens.map(token => ({
      competitionId: newCompetition.id,
      tokenId: token.id,
      symbol: token.symbol,
      name: token.name,
      imageUrl: token.image,
      marketCapRank: token.market_cap_rank
    }));

    await prisma.competitionToken.createMany({
      data: tokensToCreate,
      skipDuplicates: true
    });

    console.log(`✅ ${tokensToCreate.length} tokens salvos na CompetitionTokens`);
    console.log(`🔒 Cardápio TRAVADO até ${nextFriday.toISOString()}\n`);

    // ============================================
    // RESUMO FINAL
    // ============================================
    const duration = Date.now() - startTime;

    console.log('✅ ========================================');
    console.log('✅ RESET CONCLUÍDO COM SUCESSO');
    console.log('✅ ========================================');
    console.log(`⏱️  Duração: ${duration}ms`);
    console.log(`📊 Competição: ${newCompetition.id}`);
    console.log(`📊 Status: ${newCompetition.status}`);
    console.log(`📊 Tokens no cardápio: ${tokensToCreate.length}`);
    console.log('');
    console.log('🔔 Próximos passos:');
    console.log('   1. Recarregar a página do frontend');
    console.log('   2. /api/market deve retornar 100 tokens');
    console.log('   3. Edição de time deve estar desbloqueada');
    console.log('');

  } catch (error) {
    console.error('❌ Erro durante reset de competição:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
resetCompetition()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  });
