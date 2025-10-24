import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leagueId } = body;
    
    console.log('🔄 Iniciando reset da competição...', { leagueId });
    
    if (!leagueId) {
      return NextResponse.json(
        { error: 'leagueId é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se a liga existe
    const league = await prisma.league.findUnique({
      where: { id: leagueId }
    });
    
    if (!league) {
      return NextResponse.json(
        { error: 'Liga não encontrada' },
        { status: 404 }
      );
    }
    
    // Resetar todos os times da liga
    const result = await prisma.team.updateMany({
      where: {
        leagueId: leagueId
      },
      data: {
        totalScore: null,
        rank: null
      }
    });
    
    console.log(`✅ Reset concluído: ${result.count} times resetados na liga ${league.name}`);
    
    return NextResponse.json({
      success: true,
      message: `Reset concluído com sucesso. ${result.count} times resetados.`,
      resetCount: result.count,
      league: {
        id: league.id,
        name: league.name
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no reset:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
