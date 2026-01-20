import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/competitions/[id]
 * Retorna informações de uma competição específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Competition ID is required' },
        { status: 400 }
      );
    }

    // Buscar competição
    const competition = await prisma.competition.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        leagueId: true
      }
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(competition);
  } catch (error) {
    console.error('[API] Error fetching competition:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
