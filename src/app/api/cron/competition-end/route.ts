import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/cron/competition-end
 *
 * Cron job otimizado para Vercel Hobby Plan (executa semanalmente):
 * - Executado toda sexta-feira às 21:00 BRT
 * - Finaliza competições ativas que devem terminar
 * - Calcula pontuações e distribui prêmios
 *
 * Schedule: "0 0 * * 6" (Sábado 00:00 UTC = Sexta-feira 21:00 BRT)
 *
 * Vercel Hobby Plan: Permite apenas crons diários (1x/dia)
 * Solução: Usar cron semanal + polling no frontend
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

    console.log('🏁 Cron Job: Finalizando competições (Execução Semanal - Sexta 21h)...');

    const now = new Date();

    // Buscar competições active que devem finalizar
    // Janela: competições agendadas para finalizar nas últimas 24h ou próximas 24h
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(`⏰ Janela de verificação: ${oneDayAgo.toISOString()} até ${oneDayLater.toISOString()}`);

    const activeCompetitions = await prisma.competition.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {  // ✅ CORREÇÃO: endDate (não endTime)
          gte: oneDayAgo,
          lte: oneDayLater
        }
      },
      include: {
        league: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`📋 Encontradas ${activeCompetitions.length} competições para finalizar`);

    const results = {
      ended: [] as string[],
      errors: [] as { competitionId: string; error: string }[]
    };

    for (const competition of activeCompetitions) {
      try {
        console.log(`🏁 Finalizando competição ${competition.id} (${competition.league.name})...`);

        // Chamar endpoint de finalização
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/competition/end`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              competitionId: competition.id
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.ended.push(competition.id);
          console.log(`✅ Competição ${competition.id} finalizada com sucesso`);
          console.log(`   🏆 Vencedores: ${data.winners?.length || 0} times premiados`);
          if (data.winners && data.winners.length > 0) {
            data.winners.forEach((w: any) => {
              console.log(`      ${w.position}º ${w.teamName}: ${w.totalScore}% - ${w.prize} SOL`);
            });
          }
        } else {
          const errorData = await response.json();
          console.error(`❌ Erro ao finalizar competição ${competition.id}:`, errorData.error);
          results.errors.push({
            competitionId: competition.id,
            error: errorData.error || 'Unknown error'
          });
        }

      } catch (error) {
        console.error(`❌ Erro ao processar competição ${competition.id}:`, error);
        results.errors.push({
          competitionId: competition.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const duration = Date.now() - startTime;

    console.log('');
    console.log('📊 RESUMO DO CRON JOB (COMPETITION END):');
    console.log(`   ✅ Competições finalizadas: ${results.ended.length}`);
    console.log(`   ❌ Erros: ${results.errors.length}`);
    console.log(`   ⏱️  Duração: ${duration}ms`);
    console.log('');

    return NextResponse.json({
      success: true,
      message: 'Cron job de finalização de competições executado com sucesso',
      results: {
        ended: results.ended,
        endedCount: results.ended.length,
        errors: results.errors,
        errorCount: results.errors.length
      },
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron Job: Erro ao finalizar competições:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao executar cron job',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/competition-end
 *
 * Permite execução manual via browser (útil para desenvolvimento)
 */
export async function GET() {
  console.log('🔄 Execução Manual: Finalizando competições...');

  const request = new NextRequest('http://localhost:3000/api/cron/competition-end', {
    method: 'POST'
  });

  return POST(request);
}
