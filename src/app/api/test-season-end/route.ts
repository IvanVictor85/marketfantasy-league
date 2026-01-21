import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test-season-end
 *
 * Endpoint TEMPORARIO para testar finalização de temporada.
 * REMOVER APOS TESTE!
 *
 * Uso: /api/test-season-end?seasonId=XXX&secret=YYY
 *      /api/test-season-end?secret=YYY  (lista temporadas)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const secret = searchParams.get('secret');

    // Verificar secret (usar CRON_SECRET)
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Se não passou seasonId, listar temporadas
    if (!seasonId) {
      const seasons = await prisma.season.findMany({
        include: {
          competitions: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        },
        orderBy: { startDate: 'desc' }
      });

      return NextResponse.json({
        message: 'Temporadas encontradas. Use ?seasonId=XXX&secret=YYY para finalizar.',
        seasons: seasons.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
          prizePool: Number(s.prizePool),
          totalRounds: s.competitions.length,
          completedRounds: s.competitions.filter(c => c.status === 'COMPLETED').length,
          pendingRounds: s.competitions.filter(c => c.status !== 'COMPLETED').length,
          canFinalize: s.competitions.every(c => c.status === 'COMPLETED')
        })),
        example: `/api/test-season-end?seasonId=${seasons[0]?.id || 'ID_AQUI'}&secret=SEU_CRON_SECRET`
      });
    }

    console.log(`🧪 [TEST] Finalizando temporada ${seasonId}...`);

    // Chamar endpoint de finalização
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mflprotocol.xyz';

    console.log(`🌐 [TEST] Usando baseUrl: ${baseUrl}`);

    const response = await fetch(`${baseUrl}/api/season/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seasonId,
        skipValidation: true  // Pular validação de rodadas pendentes
      })
    });

    const result = await response.json();

    return NextResponse.json({
      message: response.ok ? '✅ Temporada finalizada com sucesso!' : '❌ Erro ao finalizar temporada',
      status: response.status,
      result
    });

  } catch (error) {
    console.error('❌ [TEST-SEASON-END] Erro:', error);
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
