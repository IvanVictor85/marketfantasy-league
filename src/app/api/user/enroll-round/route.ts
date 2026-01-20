import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Função para obter o usuário autenticado (mesmo padrão de confirm-entry)
async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const authToken = await prisma.authToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!authToken || authToken.expiresAt < new Date()) {
      return null;
    }

    return authToken.userId;
  } catch (error) {
    console.error('❌ [AUTH] Erro ao obter usuário:', error);
    return null;
  }
}

/**
 * POST /api/user/enroll-round
 *
 * Inscreve usuário em uma rodada específica
 * Requisitos:
 * - Usuário deve estar autenticado
 * - Usuário deve ter entrada ativa na liga (LeagueEntry)
 * - Rodada deve estar UPCOMING (não pode inscrever em ACTIVE ou COMPLETED)
 * - Usuário não pode estar já inscrito na rodada
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 SEGURANÇA: Obter userId do usuário autenticado
    const userId = await getUserFromRequest(request);

    if (!userId) {
      console.error('❌ [ENROLL] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { competitionId, teamName, players } = body;

    if (!competitionId) {
      return NextResponse.json(
        { error: 'competitionId é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log('📝 [ENROLL] Tentando inscrever usuário:', user.email || user.id);
    console.log('📝 [ENROLL] Rodada:', competitionId);

    // 2. Buscar competição
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Rodada não encontrada' },
        { status: 404 }
      );
    }

    console.log('📊 [ENROLL] Status da rodada:', competition.status);

    // 3. Verificar se rodada está UPCOMING
    if (competition.status !== 'UPCOMING') {
      return NextResponse.json(
        {
          error: 'Só é possível inscrever-se em rodadas UPCOMING',
          currentStatus: competition.status
        },
        { status: 400 }
      );
    }

    // 4. Verificar se usuário tem entrada na liga
    const leagueEntry = await prisma.leagueEntry.findFirst({
      where: {
        userId: user.id,
        leagueId: competition.leagueId
      }
    });

    if (!leagueEntry) {
      return NextResponse.json(
        {
          error: 'Você precisa estar inscrito na liga primeiro',
          leagueName: competition.league.name
        },
        { status: 400 }
      );
    }

    // 5. Verificar se já está inscrito nesta rodada
    const existingTeam = await prisma.userTeam.findFirst({
      where: {
        userId: user.id,
        competitionId: competitionId
      }
    });

    if (existingTeam) {
      return NextResponse.json(
        {
          error: 'Você já está inscrito nesta rodada',
          teamId: existingTeam.id
        },
        { status: 400 }
      );
    }

    // 6. Buscar time atual do usuário na liga (se existir)
    // Pegar o time mais recente do usuário nessa liga
    const latestTeam = await prisma.userTeam.findFirst({
      where: {
        userId: user.id,
        competition: {
          leagueId: competition.leagueId
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        teamName: true,
        players: true
      }
    });

    // 7. Criar UserTeam para esta rodada
    // Se forneceu teamName/players, usar eles; senão usar do time anterior
    const finalTeamName = teamName || latestTeam?.teamName || `Time de ${user.name}`;
    const finalPlayers = players || latestTeam?.players || [];

    const newTeam = await prisma.userTeam.create({
      data: {
        userId: user.id,
        competitionId: competitionId,
        teamName: finalTeamName,
        players: finalPlayers,
        totalPoints: 0
      }
    });

    console.log('✅ [ENROLL] Time criado com sucesso:', newTeam.id);

    return NextResponse.json({
      success: true,
      message: 'Inscrição realizada com sucesso',
      team: {
        id: newTeam.id,
        teamName: newTeam.teamName,
        players: newTeam.players,
        competition: {
          id: competition.id,
          name: competition.name,
          status: competition.status,
          startDate: competition.startDate,
          endDate: competition.endDate
        }
      }
    });

  } catch (error) {
    console.error('❌ [ENROLL] Erro ao inscrever usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
