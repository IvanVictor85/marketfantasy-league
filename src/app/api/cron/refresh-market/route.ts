import { NextResponse } from 'next/server';
import { refreshCache } from '@/lib/cache/coingecko-cache';

/**
 * POST /api/cron/refresh-market
 *
 * Endpoint para atualização automática do cache de mercado.
 * Deve ser chamado por um cron job (Vercel Cron, GitHub Actions, etc.)
 *
 * Para Vercel Cron, adicionar em vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/refresh-market",
 *     "schedule": "0,10,20,30,40,50 * * * *"
 *   }]
 * }
 *
 * Isso executa a cada 10 minutos.
 */
export async function POST(request: Request) {
  try {
    // Verificar autorização (opcional mas recomendado)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ Tentativa de acesso não autorizado ao cron job');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Cron Job: Iniciando atualização do cache de mercado...');

    const startTime = Date.now();

    // Atualizar cache
    await refreshCache();

    const duration = Date.now() - startTime;

    console.log(`✅ Cron Job: Cache atualizado com sucesso em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Cache atualizado com sucesso',
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron Job: Erro ao atualizar cache:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar cache',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/refresh-market
 *
 * Permite atualização manual via browser (útil para desenvolvimento)
 */
export async function GET() {
  try {
    console.log('🔄 Atualização Manual: Iniciando...');

    const startTime = Date.now();
    await refreshCache();
    const duration = Date.now() - startTime;

    console.log(`✅ Atualização Manual: Concluída em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Cache atualizado manualmente',
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Atualização Manual: Erro:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar cache',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
