import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Buscar todas as ligas
    const leagues = await prisma.league.findMany({
      orderBy: [
        { leagueType: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      leagues
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar ligas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
