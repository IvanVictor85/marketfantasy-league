import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/seasons
 * Busca todas as temporadas com suas competições
 * Query params:
 * - leagueId: ID da liga (obrigatório)
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

    // Buscar todas as temporadas da liga com suas competições
    const seasons = await prisma.season.findMany({
      orderBy: {
        startDate: 'desc' // Mais recentes primeiro
      },
      include: {
        competitions: {
          where: {
            leagueId: leagueId
          },
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    // Enriquecer dados de temporada com estatísticas
    const enrichedSeasons = seasons.map(season => {
      const totalRounds = season.competitions.length;
      const completedRounds = season.competitions.filter(c => c.status === 'COMPLETED').length;
      const activeRounds = season.competitions.filter(c => c.status === 'ACTIVE').length;
      const upcomingRounds = season.competitions.filter(c => c.status === 'UPCOMING').length;

      // Determinar status da temporada
      let seasonStatus = season.status;
      if (totalRounds > 0) {
        if (completedRounds === totalRounds) {
          seasonStatus = 'COMPLETED';
        } else if (activeRounds > 0 || completedRounds > 0) {
          seasonStatus = 'ACTIVE';
        } else {
          seasonStatus = 'UPCOMING';
        }
      }

      return {
        id: season.id,
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
        status: seasonStatus,
        stats: {
          totalRounds,
          completedRounds,
          activeRounds,
          upcomingRounds
        }
      };
    });

    return NextResponse.json({
      seasons: enrichedSeasons
    });

  } catch (error) {
    console.error('❌ Erro ao buscar temporadas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar temporadas' },
      { status: 500 }
    );
  }
}
