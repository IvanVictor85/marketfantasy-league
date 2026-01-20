import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/leagues
 *
 * Retorna todas as ligas disponíveis com suas informações
 * Nova arquitetura: Leagues agora são TIPOS de competição (regras)
 */
export async function GET(request: NextRequest) {
  try {
    logger.info('Buscando ligas disponíveis');

    const leagues = await prisma.league.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        entryFee: true,
        emblemUrl: true,
        badgeUrl: true,
        bannerUrl: true,
        _count: {
          select: {
            competitions: true,
            allowedPlayers: true,
          },
        },
      },
    });

    logger.debug('Ligas encontradas', { count: leagues.length });

    // Formatar resposta
    const formattedLeagues = leagues.map((league) => ({
      id: league.id,
      name: league.name,
      description: league.description,
      entryFee: Number(league.entryFee),
      emblemUrl: league.emblemUrl,
      badgeUrl: league.badgeUrl,
      bannerUrl: league.bannerUrl,
      competitionsCount: league._count.competitions,
      allowedTokensCount: league._count.allowedPlayers,
    }));

    return NextResponse.json({
      success: true,
      leagues: formattedLeagues,
    });
  } catch (error) {
    logger.error('Erro ao buscar ligas', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar ligas',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leagues
 *
 * Cria uma nova liga (apenas admin)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, entryFee, emblemUrl, badgeUrl, bannerUrl } = body;

    logger.info('Criando nova liga', { name });

    // Validação básica
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome da liga é obrigatório',
        },
        { status: 400 }
      );
    }

    // Criar liga
    const league = await prisma.league.create({
      data: {
        name,
        description,
        entryFee: entryFee || 10,
        emblemUrl,
        badgeUrl,
        bannerUrl,
      },
    });

    logger.info('Liga criada com sucesso', { leagueId: league.id });

    return NextResponse.json({
      success: true,
      league: {
        id: league.id,
        name: league.name,
        description: league.description,
        entryFee: Number(league.entryFee),
        emblemUrl: league.emblemUrl,
        badgeUrl: league.badgeUrl,
        bannerUrl: league.bannerUrl,
      },
    });
  } catch (error) {
    logger.error('Erro ao criar liga', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar liga',
      },
      { status: 500 }
    );
  }
}
