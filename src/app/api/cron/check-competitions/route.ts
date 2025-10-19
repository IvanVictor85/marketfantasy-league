import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/cron/check-competitions
 *
 * Cron job que roda a cada 1 minuto para:
 * - Iniciar competições pending que já atingiram startTime
 * - Finalizar competições active que já atingiram endTime
 *
 * Para Vercel Cron, adicionar em vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-competitions",
 *     "schedule": "* * * * *"
 *   }]
 * }
 *
 * Executa a cada 1 minuto.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ Tentativa de acesso não autorizado ao cron job check-competitions');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Cron Job: Verificando competições...');

    const now = new Date();
    const results = {
      started: [] as string[],
      ended: [] as string[],
      errors: [] as { competitionId: string; error: string }[]
    };

    // ============================================
    // ETAPA 1: INICIAR COMPETIÇÕES PENDENTES
    // ============================================

    console.log('🔍 Buscando competições pendentes para iniciar...');

    const pendingCompetitions = await prisma.competition.findMany({
      where: {
        status: 'pending',
        startTime: {
          lte: now
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

    // ============================================
    // ETAPA 2: FINALIZAR COMPETIÇÕES ATIVAS
    // ============================================

    console.log('🔍 Buscando competições ativas para finalizar...');

    const activeCompetitions = await prisma.competition.findMany({
      where: {
        status: 'active',
        endTime: {
          lte: now
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

    // ============================================
    // RESULTADO
    // ============================================

    const duration = Date.now() - startTime;

    console.log('');
    console.log('📊 RESUMO DO CRON JOB:');
    console.log(`   ✅ Competições iniciadas: ${results.started.length}`);
    console.log(`   ✅ Competições finalizadas: ${results.ended.length}`);
    console.log(`   ❌ Erros: ${results.errors.length}`);
    console.log(`   ⏱️  Duração: ${duration}ms`);
    console.log('');

    return NextResponse.json({
      success: true,
      message: 'Cron job executado com sucesso',
      results: {
        started: results.started,
        startedCount: results.started.length,
        ended: results.ended,
        endedCount: results.ended.length,
        errors: results.errors,
        errorCount: results.errors.length
      },
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron Job: Erro ao verificar competições:', error);

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
 * GET /api/cron/check-competitions
 *
 * Permite execução manual via browser (útil para desenvolvimento)
 */
export async function GET() {
  console.log('🔄 Execução Manual: Verificando competições...');

  // Redirecionar para POST (mesmo comportamento)
  const request = new NextRequest('http://localhost:3000/api/cron/check-competitions', {
    method: 'POST'
  });

  return POST(request);
}
