import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('id');

    if (!competitionId) {
      return NextResponse.json(
        { error: 'ID da competição é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO: Lidar com o ID "falso" do template
    if (competitionId === 'main_template') {
      return NextResponse.json({
        competition: {
          id: 'main_template',
          leagueId: 'main_template',
          startTime: null,
          endTime: null,
          status: 'N/A',
          prizePool: 0,
          distributed: false
        },
        rankings: [],
        winners: [],
        totalParticipants: 0,
        loading: false,
        error: null,
        isTemplate: true,
        isEditingAllowed: true // Template pode sempre ser editado
      });
    }

    // Buscar a liga/competição
    let league;

    if (competitionId === 'main-league') {
      league = await prisma.league.findFirst({
        where: {
          name: {
            contains: 'Principal',
            mode: 'insensitive'
          }
        },
        include: {
          competitions: true
        }
      });
    } else {
      league = await prisma.league.findUnique({
        where: {
          id: competitionId
        },
        include: {
          competitions: true
        }
      });
    }

    if (!league) {
      console.log('❌ Liga não encontrada:', competitionId);
      return NextResponse.json(
        { error: 'Liga não encontrada' },
        { status: 404 }
      );
    }

    // ✅ CORREÇÃO: Ordenar por startDate DESC para pegar a rodada ACTIVE mais recente
    const sortedCompetitions = league.competitions.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    let activeCompetition = sortedCompetitions.find(comp => comp.status === 'ACTIVE');
    if (!activeCompetition && sortedCompetitions.length > 0) {
      activeCompetition = sortedCompetitions[0]; // Usar a primeira (mais recente) se não houver ativa
    }

    // Se não há dados de competição, retornar null
    if (!activeCompetition) {
      console.log('⚠️ Nenhuma competição ativa encontrada');

      return NextResponse.json({
        competitionId: null,
        leagueId: league.id,
        status: null,
        startDate: null,
        endDate: null,
        prizePool: 0,
        distributed: false,
        participants: 0,
        rankings: [],
        winners: [],
        error: 'Nenhuma competição ativa encontrada'
      });
    }

    // Buscar times da liga para calcular participantes
    const teamCount = await prisma.team.count({
      where: {
        leagueId: league.id
      }
    });

    // ✅ REFATORAÇÃO: API retorna dados "crus", frontend decide o que mostrar
    const responseData = {
      competitionId: activeCompetition.id,
      leagueId: activeCompetition.leagueId,

      // Dados "crus" - sem cálculo de isActive
      status: activeCompetition.status,           // 'ACTIVE', 'PENDING', 'COMPLETED'
      startDate: activeCompetition.startDate,     // Data de LOCK (domingo 21h)
      endDate: activeCompetition.endDate,         // Data de FIM (sexta 21h)

      prizePool: activeCompetition.prizePool,
      distributed: activeCompetition.distributed,
      participants: teamCount,

      // Dados de rodada (para compatibilidade)
      rankings: [],
      winners: []
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Erro ao buscar status da competição:', error instanceof Error ? error.message : String(error));

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}