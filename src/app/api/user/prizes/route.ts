import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const leagueId = searchParams.get('leagueId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ FIX: Buscar IDs de competições e temporadas da liga primeiro
    let validCompetitionIds: string[] = [];
    let validSeasonIds: string[] = [];

    if (leagueId) {
      // Buscar competições da liga
      const leagueCompetitions = await prisma.competition.findMany({
        where: { leagueId: leagueId },
        select: { id: true, seasonId: true }
      });
      validCompetitionIds = leagueCompetitions.map(c => c.id);

      // ✅ FIX: Buscar seasonIds únicos das competições encontradas
      const uniqueSeasonIds = [...new Set(
        leagueCompetitions
          .filter(c => c.seasonId !== null)
          .map(c => c.seasonId!)
      )];
      validSeasonIds = uniqueSeasonIds;
    }

    // Construir whereClause com IDs válidos
    const whereClause: any = {
      userId: userId
    };

    // Se leagueId foi fornecido, filtrar por competições/temporadas dessa liga
    if (leagueId) {
      const orConditions = [];

      if (validCompetitionIds.length > 0) {
        orConditions.push({ competitionId: { in: validCompetitionIds } });
      }

      if (validSeasonIds.length > 0) {
        orConditions.push({ seasonId: { in: validSeasonIds } });
      }

      // Só adicionar OR se houver condições
      if (orConditions.length > 0) {
        whereClause.OR = orConditions;
      }
    }

    const prizes = await prisma.prizeClaim.findMany({
      where: whereClause,
      orderBy: [
        { claimed: 'asc' },  // Não reclamados primeiro
        { createdAt: 'desc' } // Mais recentes primeiro
      ]
    });

    // Buscar nomes de competições e temporadas
    const competitionIds = prizes.filter(p => p.competitionId).map(p => p.competitionId!);
    const seasonIds = prizes.filter(p => p.seasonId).map(p => p.seasonId!);

    const competitions = await prisma.competition.findMany({
      where: { id: { in: competitionIds } },
      select: { id: true, name: true }
    });

    const seasons = await prisma.season.findMany({
      where: { id: { in: seasonIds } },
      select: { id: true, name: true }
    });

    const competitionMap = Object.fromEntries(competitions.map(c => [c.id, c.name]));
    const seasonMap = Object.fromEntries(seasons.map(s => [s.id, s.name]));

    // Formatar prêmios para o frontend
    const formattedPrizes = prizes.map(prize => ({
      id: prize.id,
      userId: prize.userId,
      competitionId: prize.competitionId || null,
      competitionName: (prize.competitionId && competitionMap[prize.competitionId]) ||
                      (prize.seasonId && seasonMap[prize.seasonId]) ||
                      'Prêmio',
      seasonId: prize.seasonId || null,
      amount: parseFloat(prize.amount.toString()),
      position: prize.position,
      claimed: prize.claimed,
      claimedAt: prize.claimedAt,
      createdAt: prize.createdAt
    }));

    return NextResponse.json({
      success: true,
      prizes: formattedPrizes,
      summary: {
        total: formattedPrizes.length,
        unclaimed: formattedPrizes.filter(p => !p.claimed).length,
        claimed: formattedPrizes.filter(p => p.claimed).length,
        totalAmount: formattedPrizes.reduce((sum, p) => sum + p.amount, 0),
        unclaimedAmount: formattedPrizes.filter(p => !p.claimed).reduce((sum, p) => sum + p.amount, 0)
      }
    });

  } catch (error) {
    console.error('❌ [API /user/prizes] Erro:', error);
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'Unknown error');

    // Retornar dados vazios em vez de erro para não quebrar o frontend
    return NextResponse.json({
      success: true,
      prizes: [],
      summary: {
        total: 0,
        unclaimed: 0,
        claimed: 0,
        totalAmount: 0,
        unclaimedAmount: 0
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}
