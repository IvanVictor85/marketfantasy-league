import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');

    if (!competitionId) {
      return NextResponse.json(
        { error: 'competitionId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar tokens da competição com snapshots
    const tokens = await prisma.competitionToken.findMany({
      where: { competitionId },
      select: {
        id: true,
        symbol: true,
        name: true,
        imageUrl: true,
        tokenId: true,
        priceStart: true,
        priceEnd: true,
        priceStartDate: true,
        priceEndDate: true,
        percentChange: true
      },
      orderBy: { symbol: 'asc' }
    });

    // Formatar tokens e adicionar imageUrl se não existir
    const formattedTokens = tokens.map(token => {
      // Usar imageUrl do banco de dados (já salvo do CoinGecko)
      const imageUrl = token.imageUrl || '';

      return {
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        imageUrl: imageUrl,
        tokenId: token.tokenId,
        priceStart: token.priceStart ? parseFloat(token.priceStart.toString()) : null,
        priceEnd: token.priceEnd ? parseFloat(token.priceEnd.toString()) : null,
        priceStartDate: token.priceStartDate,
        priceEndDate: token.priceEndDate,
        percentChange: token.percentChange ? parseFloat(token.percentChange.toString()) : null
      };
    });

    return NextResponse.json({
      success: true,
      competitionId,
      tokens: formattedTokens,
      total: formattedTokens.length
    });

  } catch (error) {
    console.error('❌ [API /competition/tokens] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar tokens da competição' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
