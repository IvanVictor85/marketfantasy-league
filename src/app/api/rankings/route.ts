import { NextRequest, NextResponse } from 'next/server';
import { ScoringService } from '@/lib/scoring-service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const forceRefresh = searchParams.get('refresh') === 'true';

    if (!leagueId) {
      return NextResponse.json(
        { error: 'leagueId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a liga existe
    const league = await prisma.league.findUnique({
      where: { id: leagueId }
    });

    if (!league) {
      return NextResponse.json(
        { error: 'Liga não encontrada' },
        { status: 404 }
      );
    }

    let ranking;

    if (forceRefresh) {
      // Recalcular rankings com dados frescos
      ranking = await ScoringService.calculateLeagueRankings(leagueId);
    } else {
      // Usar ranking atual do banco
      ranking = await ScoringService.getCurrentRanking(leagueId);
      
      // Se não há ranking ou está muito antigo, recalcular
      if (!ranking || !ranking.teams.length) {
        ranking = await ScoringService.calculateLeagueRankings(leagueId);
      }
    }

    return NextResponse.json({
      success: true,
      ranking,
      cacheInfo: {
        lastUpdated: ranking.lastUpdated,
        totalTeams: ranking.totalTeams,
        forceRefresh
      }
    });

  } catch (error) {
    console.error('Error in rankings API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leagueId, action } = body;

    if (!leagueId) {
      return NextResponse.json(
        { error: 'leagueId é obrigatório' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'recalculate':
        // Recalcular rankings
        const ranking = await ScoringService.calculateLeagueRankings(leagueId);
        
        return NextResponse.json({
          success: true,
          message: 'Rankings recalculados com sucesso',
          ranking,
          timestamp: new Date().toISOString()
        });

      case 'simulate':
        // Gerar dados simulados para teste
        const simulatedTeams = ScoringService.generateSimulatedScores(6);
        
        return NextResponse.json({
          success: true,
          message: 'Dados simulados gerados',
          teams: simulatedTeams,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in rankings POST API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
