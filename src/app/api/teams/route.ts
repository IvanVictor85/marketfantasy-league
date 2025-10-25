import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    
    // Buscar liga (principal se não especificada)
    let league;
    if (leagueId) {
      league = await prisma.league.findUnique({
        where: { id: leagueId }
      });
    } else {
      league = await prisma.league.findFirst({
        where: {
          leagueType: 'MAIN',
          isActive: true
        }
      });
    }
    
    if (!league) {
      return NextResponse.json(
        { error: 'Liga não encontrada' },
        { status: 404 }
      );
    }
    
    // Buscar todos os times da liga ordenados por ranking
    const teams = await prisma.team.findMany({
      where: {
        leagueId: league.id,
        hasValidEntry: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { rank: 'asc' },
        { totalScore: 'desc' }
      ]
    });
    
    // Parse tokens para cada time
    const teamsWithParsedTokens = teams.map(team => {
      let tokens = [];
      try {
        tokens = JSON.parse(team.tokens);
      } catch (error) {
        console.error(`Erro ao parsear tokens do time ${team.teamName}:`, error);
        tokens = [];
      }
      
      return {
        ...team,
        tokens
      };
    });
    
    return NextResponse.json({
      success: true,
      league: {
        id: league.id,
        name: league.name,
        entryFee: league.entryFee,
        totalPrizePool: league.totalPrizePool,
        participantCount: league.participantCount
      },
      teams: teamsWithParsedTokens
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar times:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
