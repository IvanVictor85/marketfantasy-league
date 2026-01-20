import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json(
        { error: 'leagueId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar liga
    const league = await prisma.league.findUnique({
      where: { id: leagueId }
    });

    if (!league) {
      return NextResponse.json(
        { error: 'Liga não encontrada' },
        { status: 404 }
      );
    }

    // Buscar competições da liga diretamente
    const competitions = await prisma.competition.findMany({
      where: { leagueId: league.id },
      include: {
        season: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    // Formatar competições
    const formattedCompetitions = competitions.map(comp => ({
      id: comp.id,
      name: comp.name || 'Rodada sem nome',
      startDate: comp.startDate?.toISOString() || '',
      endDate: comp.endDate?.toISOString() || '',
      status: comp.status,
      seasonId: comp.season?.id || null,
      seasonName: comp.season?.name || 'Sem temporada'
    }));

    return NextResponse.json({
      success: true,
      league: {
        id: league.id,
        name: league.name
      },
      competitions: formattedCompetitions
    });

  } catch (error) {
    console.error('❌ [API /league/competitions] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar competições' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
