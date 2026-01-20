import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/competitions
 *
 * Retorna todas as competições/rodadas de uma liga
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json(
        { error: 'leagueId é obrigatório' },
        { status: 400 }
      );
    }

    console.log('📊 [API /api/competitions] Buscando competições para liga:', leagueId);

    // Buscar todas as competições da liga, ordenadas da mais recente para a mais antiga
    const competitions = await prisma.competition.findMany({
      where: {
        leagueId: leagueId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        seasonId: true  // ✅ ADICIONADO - Necessário para opção "Temporada"
      }
    });

    console.log(`✅ [API /api/competitions] Encontradas ${competitions.length} competições`);

    return NextResponse.json({
      success: true,
      competitions: competitions,
      count: competitions.length
    });

  } catch (error) {
    console.error('❌ [API /api/competitions] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar competições' },
      { status: 500 }
    );
  }
}
