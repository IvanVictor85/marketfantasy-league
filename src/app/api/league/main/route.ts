import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/league/main
 *
 * Retorna informações da Liga Principal com a competição ativa atual
 * Nova arquitetura: League (tipo) + Competition (rodada ativa)
 */
export async function GET(request: NextRequest) {
  try {
    logger.info('Buscando Liga Principal');

    // 1. Buscar a Liga Principal (por nome)
    const league = await prisma.league.findFirst({
      where: {
        name: 'Liga Principal MarketFantasy'
      },
      include: {
        _count: {
          select: {
            competitions: true,
            allowedPlayers: true
          }
        }
      }
    });

    if (!league) {
      logger.warn('Liga Principal não encontrada');
      return NextResponse.json(
        { error: 'Liga Principal não encontrada' },
        { status: 404 }
      );
    }

    // 2. Buscar a competição ATIVA desta liga
    const activeCompetition = await prisma.competition.findFirst({
      where: {
        leagueId: league.id,
        status: 'ACTIVE'
      },
      include: {
        _count: {
          select: {
            userTeams: true
          }
        },
        season: {
          select: {
            id: true,
            name: true,
            prizePool: true,
            status: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // 3. Se há competição ativa, buscar informações adicionais da temporada
    let seasonInfo = null;
    if (activeCompetition?.season) {
      // Buscar todas as competições da temporada para contar
      const seasonCompetitions = await prisma.competition.findMany({
        where: {
          seasonId: activeCompetition.season.id,
          leagueId: league.id
        },
        orderBy: {
          startDate: 'asc'
        },
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true
        }
      });

      const totalRounds = seasonCompetitions.length;
      const completedRounds = seasonCompetitions.filter(c => c.status === 'COMPLETED').length;
      const currentRoundIndex = seasonCompetitions.findIndex(c => c.id === activeCompetition.id);
      const currentRoundNumber = currentRoundIndex !== -1 ? currentRoundIndex + 1 : null;

      seasonInfo = {
        id: activeCompetition.season.id,
        name: activeCompetition.season.name,
        prizePool: Number(activeCompetition.season.prizePool),
        status: activeCompetition.season.status,
        totalRounds,
        completedRounds,
        currentRoundNumber
      };
    }

    // 3. Contar entradas confirmadas para esta liga
    const confirmedEntries = await prisma.leagueEntry.count({
      where: {
        status: 'CONFIRMED'
        // Nota: LeagueEntry não tem leagueId direto, apenas competitionId
        // Podemos melhorar isso depois se necessário
      }
    });

    logger.debug('Liga Principal encontrada', {
      leagueId: league.id,
      competitionsCount: league._count.competitions,
      activeCompetition: activeCompetition?.id
    });

    // ✅ REFATORAÇÃO: Retornar dados "crus", frontend decide o que mostrar
    return NextResponse.json({
      id: league.id,
      name: league.name,
      description: league.description,
      entryFee: Number(league.entryFee),

      // Informações da competição ativa
      totalPrizePool: activeCompetition ? Number(activeCompetition.prizePool) : 0,
      participantCount: activeCompetition?._count.userTeams || 0,
      confirmedEntries: confirmedEntries,
      teamsCreated: activeCompetition?._count.userTeams || 0,

      // ✅ Dados "crus" da competição - SEM cálculo de isActive
      status: activeCompetition?.status || null,
      startDate: activeCompetition?.startDate || null,
      endDate: activeCompetition?.endDate || null,

      // Assets visuais
      badgeUrl: league.badgeUrl,
      bannerUrl: league.bannerUrl,
      emblemUrl: league.emblemUrl,

      // Informações de contagem
      competitionsCount: league._count.competitions,
      allowedTokensCount: league._count.allowedPlayers,

      // ✅ NOVO: Informações completas da temporada
      season: seasonInfo,

      // ID da competição ativa (útil para o frontend)
      activeCompetitionId: activeCompetition?.id || null
    });

  } catch (error) {
    logger.error('Erro ao buscar Liga Principal', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/league/main
 *
 * Atualiza estatísticas da Liga Principal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'refresh-stats') {
      logger.info('Atualizando estatísticas da Liga Principal');

      // 1. Buscar a Liga Principal
      const league = await prisma.league.findFirst({
        where: {
          name: 'Liga Principal MarketFantasy'
        }
      });

      if (!league) {
        return NextResponse.json(
          { error: 'Liga Principal não encontrada' },
          { status: 404 }
        );
      }

      // 2. Buscar a competição ativa
      const activeCompetition = await prisma.competition.findFirst({
        where: {
          leagueId: league.id,
          status: 'ACTIVE'
        },
        orderBy: {
          startDate: 'desc' // ✅ CORREÇÃO: Pegar a rodada ACTIVE mais recente
        }
      });

      if (!activeCompetition) {
        return NextResponse.json(
          { error: 'Nenhuma competição ativa encontrada' },
          { status: 404 }
        );
      }

      // 3. Contar times participantes
      const participantCount = await prisma.userTeam.count({
        where: {
          competitionId: activeCompetition.id
        }
      });

      // 4. Calcular prize pool (baseado nas entradas confirmadas)
      const confirmedEntries = await prisma.leagueEntry.count({
        where: {
          status: 'CONFIRMED'
          // Idealmente filtrar por competitionId quando o campo estiver populado
        }
      });

      const totalPrizePool = confirmedEntries * Number(league.entryFee);

      // 5. Atualizar prize pool da competição
      const updatedCompetition = await prisma.competition.update({
        where: { id: activeCompetition.id },
        data: {
          prizePool: totalPrizePool * 0.7 // 70% para a rodada
        }
      });

      logger.info('Estatísticas atualizadas', {
        competitionId: updatedCompetition.id,
        participantCount,
        totalPrizePool
      });

      return NextResponse.json({
        success: true,
        message: 'Estatísticas da liga atualizadas',
        league: {
          id: league.id,
          participantCount: participantCount,
          totalPrizePool: Number(updatedCompetition.prizePool),
          confirmedEntries: confirmedEntries
        }
      });
    }

    return NextResponse.json(
      { error: 'Ação não reconhecida' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Erro ao atualizar Liga Principal', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
