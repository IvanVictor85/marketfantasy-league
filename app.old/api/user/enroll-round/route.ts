import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/enroll-round
 * Inscreve usuário em uma rodada específica
 *
 * IMPORTANTE: O usuário deve pagar 0.025 SOL para se inscrever
 * A inscrição NÃO pode ser cancelada após o pagamento
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { competitionId, teamName, players, paymentTxHash } = body;

    if (!competitionId) {
      return NextResponse.json(
        { error: 'competitionId é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // 2. Buscar competição
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: {
          select: { id: true, name: true, entryFee: true }
        }
      }
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Competição não encontrada' },
        { status: 404 }
      );
    }

    // 3. Verificar se rodada está UPCOMING
    if (competition.status !== 'UPCOMING') {
      return NextResponse.json({
        error: 'Só é possível inscrever-se em rodadas UPCOMING',
        currentStatus: competition.status
      }, { status: 400 });
    }

    // 4. Verificar se usuário tem entrada na liga
    const leagueEntry = await prisma.leagueEntry.findFirst({
      where: {
        userId: user.id,
        leagueId: competition.leagueId
      }
    });

    if (!leagueEntry) {
      return NextResponse.json({
        error: 'Você precisa estar inscrito na liga primeiro',
        leagueName: competition.league.name
      }, { status: 400 });
    }

    // 5. Verificar se já está inscrito
    const existingTeam = await prisma.userTeam.findFirst({
      where: {
        userId: user.id,
        competitionId: competitionId
      }
    });

    if (existingTeam) {
      return NextResponse.json({
        error: 'Você já está inscrito nesta rodada',
        teamId: existingTeam.id
      }, { status: 400 });
    }

    // 6. Buscar time mais recente do usuário na mesma liga
    const latestTeam = await prisma.userTeam.findFirst({
      where: {
        userId: user.id,
        competition: { leagueId: competition.leagueId }
      },
      orderBy: { createdAt: 'desc' },
      select: { teamName: true, players: true }
    });

    // 7. Definir nome do time e jogadores
    const finalTeamName = teamName || latestTeam?.teamName || `Time de ${user.name}`;
    const finalPlayers = players || latestTeam?.players || [];

    // 8. Criar UserTeam com informações de pagamento
    // TODO: Validar paymentTxHash no blockchain Solana antes de criar
    const entryFee = competition.league.entryFee || 0.025;

    const newTeam = await prisma.userTeam.create({
      data: {
        userId: user.id,
        competitionId: competitionId,
        teamName: finalTeamName,
        players: finalPlayers,
        totalPoints: 0,
        entryFeePaid: !!paymentTxHash, // true se tiver hash de pagamento
        paymentTxHash: paymentTxHash || null,
        entryFeeAmount: paymentTxHash ? entryFee : 0
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Inscrição realizada com sucesso',
      team: {
        id: newTeam.id,
        teamName: newTeam.teamName,
        entryFeePaid: newTeam.entryFeePaid
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao processar inscrição:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}
