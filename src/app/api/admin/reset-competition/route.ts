import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTop100Tokens } from '@/lib/services/coingecko.service';

/**
 * POST /api/admin/reset-competition
 *
 * 🚨 ROTA DE EMERGÊNCIA - ADMIN ONLY
 *
 * Esta rota faz um "reset" completo do estado da competição.
 * Usado para corrigir estados de "limbo" após refatorações ou bugs.
 *
 * O QUE FAZ:
 * 1. Limpa TODAS as competições existentes (e seus CompetitionTokens via cascade)
 * 2. Busca Top 100 tokens da CoinGecko
 * 3. Cria uma nova competição "pending" (Draft aberto)
 * 4. Salva o cardápio de 100 tokens no banco
 *
 * PROTEÇÃO: Requer CRON_SECRET no header Authorization
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 🔒 VERIFICAÇÃO DE SEGURANÇA - FAIL-FIRST
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // CRÍTICO: Bloquear se o secret não estiver configurado OU se o header não bater
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ Tentativa de acesso não autorizado - CRON_SECRET ausente ou inválido');
      return NextResponse.json(
        { error: 'Unauthorized - CRON_SECRET required' },
        { status: 401 }
      );
    }

    console.log('🚨 ========================================');
    console.log('🚨 ADMIN: RESET DE COMPETIÇÃO INICIADO');
    console.log('🚨 ========================================');

    // ============================================
    // ETAPA 1: LIMPAR ESTADO ANTIGO
    // ============================================
    console.log('\n🗑️  ETAPA 1: Limpando competições antigas...');

    // Contar competições antes de deletar
    const competitionsCount = await prisma.competition.count();
    console.log(`📊 Competições encontradas: ${competitionsCount}`);

    if (competitionsCount > 0) {
      // Deletar TODAS as competições
      // CompetitionTokens serão deletados automaticamente (onDelete: Cascade)
      await prisma.competition.deleteMany({});
      console.log(`✅ ${competitionsCount} competição(ões) deletada(s)`);
      console.log('✅ CompetitionTokens deletados automaticamente (cascade)');
    } else {
      console.log('ℹ️  Nenhuma competição para deletar');
    }

    // ============================================
    // ETAPA 2: BUSCAR TOP 100 DA COINGECKO
    // ============================================
    console.log('\n🌐 ETAPA 2: Buscando Top 100 tokens da CoinGecko...');

    const top100Tokens = await getTop100Tokens();
    console.log(`✅ ${top100Tokens.length} tokens obtidos da CoinGecko`);

    // ============================================
    // ETAPA 3: CALCULAR DATAS DA PRÓXIMA RODADA
    // ============================================
    console.log('\n📅 ETAPA 3: Calculando datas da próxima rodada...');

    const now = new Date();
    console.log(`⏰ Horário atual: ${now.toISOString()}`);

    // Próximo Domingo às 21h (BRT = UTC-3)
    const nextSunday = new Date(now);
    const dayOfWeek = now.getDay(); // 0 = Domingo, 6 = Sábado
    const daysUntilSunday = dayOfWeek === 0 ? 7 : (7 - dayOfWeek); // Próximo domingo

    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(21, 0, 0, 0); // 21:00:00

    // Próxima Sexta às 21h (5 dias após domingo)
    const nextFriday = new Date(nextSunday);
    nextFriday.setDate(nextSunday.getDate() + 5);

    console.log(`📅 Início (Domingo 21h): ${nextSunday.toISOString()}`);
    console.log(`📅 Fim (Sexta 21h): ${nextFriday.toISOString()}`);

    // ============================================
    // ETAPA 4: CRIAR NOVA COMPETIÇÃO (PENDING)
    // ============================================
    console.log('\n🏗️  ETAPA 4: Criando nova competição...');

    // Buscar a liga principal
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

    // Criar competição
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
    console.log(`   Fim: ${newCompetition.endTime.toISOString()}`);

    // ============================================
    // ETAPA 5: SALVAR CARDÁPIO DE TOKENS
    // ============================================
    console.log('\n💾 ETAPA 5: Salvando cardápio de tokens...');

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
    console.log(`🔒 Cardápio TRAVADO até ${nextFriday.toISOString()}`);

    // ============================================
    // RESUMO FINAL
    // ============================================
    const duration = Date.now() - startTime;

    console.log('\n✅ ========================================');
    console.log('✅ RESET CONCLUÍDO COM SUCESSO');
    console.log('✅ ========================================');
    console.log(`⏱️  Duração: ${duration}ms`);
    console.log(`📊 Competição: ${newCompetition.id}`);
    console.log(`📊 Status: ${newCompetition.status}`);
    console.log(`📊 Tokens no cardápio: ${tokensToCreate.length}`);
    console.log('');

    return NextResponse.json({
      success: true,
      message: 'Reset de competição concluído com sucesso',
      competition: {
        id: newCompetition.id,
        status: newCompetition.status,
        startTime: newCompetition.startTime,
        endTime: newCompetition.endTime,
        leagueId: newCompetition.leagueId,
        leagueName: mainLeague.name
      },
      tokens: {
        count: tokensToCreate.length,
        sample: tokensToCreate.slice(0, 5).map(t => t.symbol) // Primeiros 5 tokens
      },
      stats: {
        competitionsDeleted: competitionsCount,
        duration
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro durante reset de competição:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao executar reset',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/reset-competition
 *
 * Versão GET para facilitar teste via browser (desenvolvimento)
 * Em produção, usar apenas POST com autenticação
 */
export async function GET(request: NextRequest) {
  console.log('⚠️  GET /api/admin/reset-competition chamado');
  console.log('⚠️  Redirecionando para POST...');

  // Criar nova request POST
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers
  });

  return POST(postRequest);
}
