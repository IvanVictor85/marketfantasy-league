import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/test-end
 *
 * CRON TEMPORARIO - Finaliza QUALQUER competicao ACTIVE
 * Ignora validacao de endDate (para testes)
 *
 * REMOVER APOS TESTE!
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verificar CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ [TEST-END] Acesso nao autorizado');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 [TEST-END] Iniciando teste de finalizacao de rodada...');

    // Buscar QUALQUER competicao ACTIVE (sem filtro de data)
    const activeCompetitions = await prisma.competition.findMany({
      where: { status: 'ACTIVE' },
      include: {
        league: { select: { id: true, name: true } }
      }
    });

    console.log(`📋 [TEST-END] Encontradas ${activeCompetitions.length} competicoes ACTIVE`);

    if (activeCompetitions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhuma competicao ACTIVE encontrada',
        timestamp: new Date().toISOString()
      });
    }

    const results = {
      ended: [] as string[],
      errors: [] as { competitionId: string; error: string }[]
    };

    for (const competition of activeCompetitions) {
      try {
        console.log(`🏁 [TEST-END] Finalizando: ${competition.name} (${competition.id})`);

        // Chamar endpoint de fim COM skipTimeValidation
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const response = await fetch(`${baseUrl}/api/competition/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            competitionId: competition.id,
            skipTimeValidation: true  // IGNORAR validacao de horario
          })
        });

        const result = await response.json();

        if (response.ok) {
          console.log(`✅ [TEST-END] Competicao ${competition.id} finalizada com sucesso`);
          results.ended.push(competition.id);
        } else {
          console.error(`❌ [TEST-END] Erro ao finalizar ${competition.id}:`, result);
          results.errors.push({ competitionId: competition.id, error: result.error || 'Unknown error' });
        }
      } catch (err) {
        console.error(`❌ [TEST-END] Excecao ao finalizar ${competition.id}:`, err);
        results.errors.push({
          competitionId: competition.id,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Teste de finalizacao concluido em ${duration}ms`,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [TEST-END] Erro fatal:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Suporte a GET para verificar status
export async function GET() {
  const activeCount = await prisma.competition.count({ where: { status: 'ACTIVE' } });

  return NextResponse.json({
    endpoint: '/api/cron/test-end',
    description: 'Cron de TESTE para finalizar rodadas ACTIVE',
    activeCompetitions: activeCount,
    usage: 'POST com header Authorization: Bearer CRON_SECRET',
    warning: 'REMOVER APOS TESTE!'
  });
}
