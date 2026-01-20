import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/cron/competition-start
 *
 * Cron job otimizado para Vercel Hobby Plan (executa semanalmente):
 * - Executado toda segunda às 00:00 UTC (domingo 21:00 BRT)
 * - Inicia competições pendentes que devem começar
 * - Cria snapshot inicial dos preços dos tokens
 *
 * Schedule: "0 0 * * 1" (Segunda 00:00 UTC = Domingo 21:00 BRT)
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

    console.log('🚀 Cron Job: Iniciando competições (Execução Semanal - Domingo 21h)...');

    const now = new Date();

    // Buscar competições pending que devem iniciar
    // Janela: competições agendadas para iniciar nas últimas 24h ou próximas 24h
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(`⏰ Janela de verificação: ${oneDayAgo.toISOString()} até ${oneDayLater.toISOString()}`);

    const pendingCompetitions = await prisma.competition.findMany({
      where: {
        status: 'PENDING',
        startDate: {  // ✅ CORREÇÃO: startDate (não startTime)
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

    console.log(`📋 Encontradas ${pendingCompetitions.length} competições para iniciar`);

    const results = {
      started: [] as string[],
      errors: [] as { competitionId: string; error: string }[]
    };

    for (const competition of pendingCompetitions) {
      try {
        console.log(`🚀 Iniciando competição ${competition.id} (${competition.league.name})...`);

        // Chamar endpoint de início
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/competition/start`,
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
          results.started.push(competition.id);
          console.log(`✅ Competição ${competition.id} iniciada com sucesso`);
          console.log(`   📊 Snapshot: ${data.snapshot?.tokensCount || 0} tokens`);
        } else {
          const errorData = await response.json();
          console.error(`❌ Erro ao iniciar competição ${competition.id}:`, errorData.error);
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
    console.log('📊 RESUMO DO CRON JOB (COMPETITION START):');
    console.log(`   ✅ Competições iniciadas: ${results.started.length}`);
    console.log(`   ❌ Erros: ${results.errors.length}`);
    console.log(`   ⏱️  Duração: ${duration}ms`);
    console.log('');

    return NextResponse.json({
      success: true,
      message: 'Cron job de início de competições executado com sucesso',
      results: {
        started: results.started,
        startedCount: results.started.length,
        errors: results.errors,
        errorCount: results.errors.length
      },
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron Job: Erro ao iniciar competições:', error);

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
 * GET /api/cron/competition-start
 *
 * Permite execução manual via browser (útil para desenvolvimento)
 */
export async function GET() {
  console.log('🔄 Execução Manual: Iniciando competições...');

  const request = new NextRequest('http://localhost:3000/api/cron/competition-start', {
    method: 'POST'
  });

  return POST(request);
}
