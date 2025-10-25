import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('id');

    console.log('🏆 [COMPETITION-STATUS] Buscando competição:', competitionId);

    if (!competitionId) {
      return NextResponse.json(
        { error: 'ID da competição é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar a liga/competição
    let league;
    
    if (competitionId === 'main-league') {
      // Buscar a Liga Principal
      league = await prisma.league.findFirst({
        where: {
          name: {
            contains: 'Principal',
            mode: 'insensitive'
          }
        },
        include: {
          competition: true
        }
      });
    } else {
      // Buscar por ID específico
      league = await prisma.league.findUnique({
        where: {
          id: competitionId
        },
        include: {
          competition: true
        }
      });
    }

    if (!league) {
      console.log('❌ [COMPETITION-STATUS] Liga não encontrada:', competitionId);
      return NextResponse.json(
        { error: 'Liga não encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ [COMPETITION-STATUS] Liga encontrada:', {
      id: league.id,
      name: league.name,
      hasCompetition: !!league.competition
    });

    // Se não há dados de competição, criar dados padrão
    if (!league.competition) {
      const defaultCompetition = {
        id: `comp-${league.id}`,
        leagueId: league.id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas no futuro
        status: 'active' as const,
        prizePool: 1000,
        distributed: false
      };

      console.log('📊 [COMPETITION-STATUS] Retornando dados padrão:', defaultCompetition);
      
      return NextResponse.json({
        competition: defaultCompetition,
        rankings: [],
        winners: [],
        totalParticipants: 0,
        loading: false,
        error: null
      });
    }

    // Buscar times da liga para calcular participantes
    const teamCount = await prisma.team.count({
      where: {
        leagueId: league.id
      }
    });

    const competitionData = {
      competition: {
        id: league.competition.id,
        leagueId: league.competition.leagueId,
        startTime: league.competition.startTime,
        endTime: league.competition.endTime,
        status: league.competition.status,
        prizePool: league.competition.prizePool,
        distributed: league.competition.distributed
      },
      rankings: [],
      winners: [],
      totalParticipants: teamCount,
      loading: false,
      error: null
    };

    console.log('✅ [COMPETITION-STATUS] Dados retornados:', {
      competitionId: competitionData.competition.id,
      startTime: competitionData.competition.startTime,
      endTime: competitionData.competition.endTime,
      participants: competitionData.totalParticipants
    });

    return NextResponse.json(competitionData);

  } catch (error) {
    console.error('❌ [COMPETITION-STATUS] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}