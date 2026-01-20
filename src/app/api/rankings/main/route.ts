import { NextRequest, NextResponse } from 'next/server';
import { ScoringService } from '@/lib/scoring-service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Buscar a Liga Principal (primeira liga criada)
    const mainLeague = await prisma.league.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (!mainLeague) {
      return NextResponse.json(
        { error: 'Liga Principal não encontrada' },
        { status: 404 }
      );
    }

    let ranking;

    if (forceRefresh) {
      // Recalcular rankings com dados frescos
      ranking = await ScoringService.calculateLeagueRankings(mainLeague.id);
    } else {
      // Usar ranking atual do banco
      ranking = await ScoringService.getCurrentRanking(mainLeague.id);
      
      // Se não há ranking ou está muito antigo, recalcular
      if (!ranking || !ranking.teams.length) {
        ranking = await ScoringService.calculateLeagueRankings(mainLeague.id);
      }
    }

    // Adicionar informações da liga
    const response = {
      success: true,
      league: {
        id: mainLeague.id,
        name: mainLeague.name,
        description: mainLeague.description,
        entryFee: mainLeague.entryFee,
        badgeUrl: mainLeague.badgeUrl,
        bannerUrl: mainLeague.bannerUrl
      },
      ranking: {
        teams: ranking.teams,
        totalTeams: ranking.totalTeams,
        lastUpdated: ranking.lastUpdated
      },
      cacheInfo: {
        lastUpdated: ranking.lastUpdated,
        totalTeams: ranking.totalTeams,
        forceRefresh
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in main league rankings API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Buscar a Liga Principal (primeira liga criada)
    const mainLeague = await prisma.league.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (!mainLeague) {
      return NextResponse.json(
        { error: 'Liga Principal não encontrada' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'recalculate':
        // Recalcular rankings da liga principal
        const ranking = await ScoringService.calculateLeagueRankings(mainLeague.id);
        
        return NextResponse.json({
          success: true,
          message: 'Rankings da Liga Principal recalculados com sucesso',
          league: {
            id: mainLeague.id,
            name: mainLeague.name
          },
          ranking: {
            teams: ranking.teams,
            totalTeams: ranking.totalTeams,
            lastUpdated: ranking.lastUpdated
          },
          timestamp: new Date().toISOString()
        });

      case 'simulate':
        // Gerar dados simulados para teste
        const simulatedTeams = ScoringService.generateSimulatedScores(6);
        
        return NextResponse.json({
          success: true,
          message: 'Dados simulados gerados para Liga Principal',
          league: {
            id: mainLeague.id,
            name: mainLeague.name
          },
          teams: simulatedTeams,
          timestamp: new Date().toISOString()
        });

      case 'refresh-stats':
        // Atualizar estatísticas da liga
        const confirmedEntries = await prisma.leagueEntry.count({
          where: {
            status: 'CONFIRMED'
          }
        });

        const totalPrizePool = Number(mainLeague.entryFee) * confirmedEntries;

        return NextResponse.json({
          success: true,
          message: 'Estatísticas da Liga Principal atualizadas',
          league: {
            id: mainLeague.id,
            participantCount: confirmedEntries,
            totalPrizePool: totalPrizePool
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in main league rankings POST API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
