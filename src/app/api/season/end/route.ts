import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/season/end
 *
 * Finaliza uma temporada:
 * - Valida que a temporada está ACTIVE
 * - Verifica se todas as rodadas foram completadas
 * - Calcula ranking final da temporada
 * - Cria PrizeClaim para top 3 (SEASON_PRIZE)
 * - Atualiza status para COMPLETED
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🏆 [SEASON-END] Finalizando temporada...');

    const body = await request.json();
    const { seasonId, skipValidation } = body;

    if (!seasonId) {
      return NextResponse.json(
        { error: 'seasonId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar temporada com competições
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        competitions: {
          orderBy: { startDate: 'asc' }
        }
      }
    });

    if (!season) {
      return NextResponse.json(
        { error: 'Temporada não encontrada' },
        { status: 404 }
      );
    }

    // Validar status
    if (season.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Temporada já foi finalizada' },
        { status: 400 }
      );
    }

    // Verificar se todas as rodadas foram completadas (exceto se skipValidation)
    if (!skipValidation) {
      const pendingOrActive = season.competitions.filter(
        c => c.status === 'PENDING' || c.status === 'ACTIVE'
      );

      if (pendingOrActive.length > 0) {
        return NextResponse.json(
          {
            error: 'Ainda existem rodadas não finalizadas',
            pendingCompetitions: pendingOrActive.map(c => ({
              id: c.id,
              name: c.name,
              status: c.status
            }))
          },
          { status: 400 }
        );
      }
    }

    const totalRounds = season.competitions.length;
    const completedRounds = season.competitions.filter(c => c.status === 'COMPLETED').length;

    console.log(`📊 [SEASON-END] Temporada: ${season.name}`);
    console.log(`   Rodadas: ${completedRounds}/${totalRounds} completadas`);
    console.log(`   Prize Pool: ${season.prizePool} SOL`);

    // Buscar SeasonRanking com participação
    const seasonRankings = await prisma.seasonRanking.findMany({
      where: { seasonId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            publicKey: true,
            name: true
          }
        }
      },
      orderBy: {
        totalSeasonPoints: 'desc'
      }
    });

    // Buscar participação de cada usuário
    const userParticipation = await prisma.userTeam.groupBy({
      by: ['userId'],
      where: {
        competition: { seasonId }
      },
      _count: { userId: true }
    });

    const participationMap = new Map<string, number>();
    userParticipation.forEach(up => {
      participationMap.set(up.userId, up._count.userId);
    });

    // Calcular ranking final COM multiplicador de participação
    const finalRankings = seasonRankings.map(ranking => {
      const rawPoints = Number(ranking.totalSeasonPoints);
      const roundsPlayed = participationMap.get(ranking.userId) || 0;
      const participationMultiplier = totalRounds > 0 ? roundsPlayed / totalRounds : 0;
      const finalPoints = rawPoints * participationMultiplier;

      return {
        userId: ranking.userId,
        username: ranking.user.username || ranking.user.name || 'Anônimo',
        publicKey: ranking.user.publicKey,
        rawPoints,
        roundsPlayed,
        participationMultiplier,
        finalPoints
      };
    });

    // Ordenar por pontos finais
    finalRankings.sort((a, b) => b.finalPoints - a.finalPoints);

    // Distribuição de prêmios da temporada (50%, 30%, 20%)
    const totalPrizePool = Number(season.prizePool);
    const prizeDistribution = [0.5, 0.3, 0.2]; // 50%, 30%, 20%

    const winners = [];

    // Criar PrizeClaim para top 3
    console.log('💰 [SEASON-END] Criando prêmios da temporada...');

    for (let i = 0; i < Math.min(3, finalRankings.length); i++) {
      const ranking = finalRankings[i];
      const position = i + 1;
      const prizeAmount = totalPrizePool * prizeDistribution[i];

      // Verificar se já existe um SEASON_PRIZE para este usuário nesta temporada
      const existingPrize = await prisma.prizeClaim.findFirst({
        where: {
          userId: ranking.userId,
          seasonId: seasonId,
          prizeType: 'SEASON_PRIZE'
        }
      });

      if (!existingPrize && prizeAmount > 0) {
        await prisma.prizeClaim.create({
          data: {
            userId: ranking.userId,
            seasonId: seasonId,
            amount: prizeAmount,
            position: position,
            prizeType: 'SEASON_PRIZE',
            claimed: false
          }
        });

        console.log(`   🏆 ${position}º ${ranking.username}: ${prizeAmount.toFixed(4)} SOL (${ranking.finalPoints.toFixed(2)} pts)`);
      }

      winners.push({
        position,
        userId: ranking.userId,
        username: ranking.username,
        publicKey: ranking.publicKey,
        rawPoints: ranking.rawPoints,
        roundsPlayed: ranking.roundsPlayed,
        participationMultiplier: ranking.participationMultiplier,
        finalPoints: ranking.finalPoints,
        prize: prizeAmount
      });
    }

    // Atualizar status da temporada
    await prisma.season.update({
      where: { id: seasonId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    const duration = Date.now() - startTime;

    console.log(`✅ [SEASON-END] Temporada finalizada em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Temporada finalizada com sucesso!',
      season: {
        id: season.id,
        name: season.name,
        status: 'COMPLETED',
        prizePool: totalPrizePool,
        totalRounds,
        completedRounds
      },
      winners,
      rankings: finalRankings.slice(0, 10), // Top 10
      duration
    });

  } catch (error) {
    console.error('❌ [SEASON-END] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro ao finalizar temporada',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/season/end
 *
 * Retorna informações sobre a finalização de uma temporada
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');

    if (!seasonId) {
      // Listar temporadas que podem ser finalizadas
      const seasons = await prisma.season.findMany({
        where: {
          status: { in: ['ACTIVE', 'UPCOMING'] }
        },
        include: {
          competitions: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        },
        orderBy: { startDate: 'desc' }
      });

      return NextResponse.json({
        message: 'Temporadas disponíveis para finalização',
        seasons: seasons.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
          prizePool: Number(s.prizePool),
          totalRounds: s.competitions.length,
          completedRounds: s.competitions.filter(c => c.status === 'COMPLETED').length,
          canFinalize: s.competitions.every(c => c.status === 'COMPLETED')
        }))
      });
    }

    // Detalhes de uma temporada específica
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        competitions: {
          orderBy: { startDate: 'asc' }
        }
      }
    });

    if (!season) {
      return NextResponse.json({ error: 'Temporada não encontrada' }, { status: 404 });
    }

    const completedRounds = season.competitions.filter(c => c.status === 'COMPLETED').length;
    const canFinalize = season.competitions.every(c => c.status === 'COMPLETED');

    return NextResponse.json({
      season: {
        id: season.id,
        name: season.name,
        status: season.status,
        prizePool: Number(season.prizePool),
        startDate: season.startDate,
        endDate: season.endDate
      },
      competitions: season.competitions.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status
      })),
      totalRounds: season.competitions.length,
      completedRounds,
      canFinalize,
      hint: canFinalize
        ? `POST /api/season/end com { "seasonId": "${seasonId}" } para finalizar`
        : 'Ainda existem rodadas não finalizadas'
    });

  } catch (error) {
    console.error('❌ [SEASON-END] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar informações da temporada' },
      { status: 500 }
    );
  }
}
