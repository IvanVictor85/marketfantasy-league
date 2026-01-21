import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test-snapshot
 *
 * Endpoint TEMPORARIO para testar snapshot de fim de rodada.
 * REMOVER APOS TESTE!
 *
 * Uso: /api/test-snapshot?action=end&competitionId=XXX&secret=YYY
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const competitionId = searchParams.get('competitionId');
    const secret = searchParams.get('secret');

    // Verificar secret (usar CRON_SECRET)
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Se nao passou competitionId, listar competicoes ativas
    if (!competitionId) {
      const competitions = await prisma.competition.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          status: true,
          league: { select: { name: true } }
        }
      });

      return NextResponse.json({
        message: 'Competicoes ACTIVE encontradas. Use ?action=end&competitionId=XXX&secret=YYY para testar snapshot.',
        competitions,
        example: `/api/test-snapshot?action=end&competitionId=${competitions[0]?.id || 'ID_AQUI'}&secret=SEU_CRON_SECRET`
      });
    }

    if (action === 'end') {
      console.log(`🧪 [TEST] Iniciando snapshot de fim para competicao ${competitionId}...`);

      // Chamar endpoint de fim com skipTimeValidation
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

      console.log(`🌐 [TEST] Usando baseUrl: ${baseUrl}`);

      const response = await fetch(`${baseUrl}/api/competition/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          skipTimeValidation: true  // Pular validacao de horario
        })
      });

      const result = await response.json();

      return NextResponse.json({
        message: response.ok ? '✅ Snapshot de FIM executado com sucesso!' : '❌ Erro no snapshot',
        status: response.status,
        result
      });
    }

    if (action === 'start') {
      console.log(`🧪 [TEST] Iniciando snapshot de inicio para competicao ${competitionId}...`);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

      console.log(`🌐 [TEST] Usando baseUrl: ${baseUrl}`);

      const response = await fetch(`${baseUrl}/api/competition/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          skipTimeValidation: true
        })
      });

      const result = await response.json();

      return NextResponse.json({
        message: response.ok ? '✅ Snapshot de INICIO executado com sucesso!' : '❌ Erro no snapshot',
        status: response.status,
        result
      });
    }

    return NextResponse.json({
      error: 'Acao invalida. Use action=end ou action=start',
      usage: '/api/test-snapshot?action=end&competitionId=XXX&secret=YYY'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [TEST-SNAPSHOT] Erro:', error);
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
