import { NextRequest, NextResponse } from 'next/server';
import { PrizeService } from '@/lib/prize-service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const action = searchParams.get('action');

    if (!leagueId) {
      return NextResponse.json(
        { error: 'leagueId é obrigatório' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'calculate':
        // Calcular distribuição de prêmios
        const distribution = await PrizeService.calculatePrizeDistribution(leagueId);
        
        return NextResponse.json({
          success: true,
          distribution,
          timestamp: new Date().toISOString()
        });

      case 'simulate':
        // Simular distribuição de prêmios
        const simulatedDistribution = await PrizeService.simulatePrizeDistribution(leagueId);
        
        return NextResponse.json({
          success: true,
          distribution: simulatedDistribution,
          simulated: true,
          timestamp: new Date().toISOString()
        });

      case 'history':
        // Obter histórico de prêmios
        const history = await PrizeService.getPrizeHistory(leagueId);
        
        return NextResponse.json({
          success: true,
          history,
          timestamp: new Date().toISOString()
        });

      case 'validate':
        // Validar se pode distribuir prêmios
        const validation = await PrizeService.canDistributePrizes(leagueId);
        
        return NextResponse.json({
          success: true,
          validation,
          timestamp: new Date().toISOString()
        });

      default:
        // Por padrão, calcular distribuição
        const defaultDistribution = await PrizeService.calculatePrizeDistribution(leagueId);
        
        return NextResponse.json({
          success: true,
          distribution: defaultDistribution,
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Error in prizes API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leagueId, action } = body;

    if (!leagueId) {
      return NextResponse.json(
        { error: 'leagueId é obrigatório' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'distribute':
        // Distribuir prêmios (simulado)
        const validation = await PrizeService.canDistributePrizes(leagueId);
        
        if (!validation.canDistribute) {
          return NextResponse.json(
            { 
              success: false, 
              error: validation.reason,
              canDistribute: false 
            },
            { status: 400 }
          );
        }

        const distribution = await PrizeService.calculatePrizeDistribution(leagueId);
        
        // Registrar distribuição no banco
        await PrizeService.recordPrizeDistribution(distribution);
        
        return NextResponse.json({
          success: true,
          message: 'Prêmios distribuídos com sucesso',
          distribution,
          timestamp: new Date().toISOString()
        });

      case 'simulate-distribution':
        // Simular distribuição completa
        const simulatedDistribution = await PrizeService.simulatePrizeDistribution(leagueId);
        
        // Registrar simulação no banco
        await PrizeService.recordPrizeDistribution(simulatedDistribution);
        
        return NextResponse.json({
          success: true,
          message: 'Simulação de distribuição realizada',
          distribution: simulatedDistribution,
          simulated: true,
          timestamp: new Date().toISOString()
        });

      case 'update-distribution':
        // Atualizar percentuais de distribuição
        const { first, second, third } = body;
        
        if (!first || !second || !third) {
          return NextResponse.json(
            { error: 'Percentuais de distribuição são obrigatórios' },
            { status: 400 }
          );
        }

        if (first + second + third !== 100) {
          return NextResponse.json(
            { error: 'A soma dos percentuais deve ser 100%' },
            { status: 400 }
          );
        }

        const updatedLeague = await prisma.league.update({
          where: { id: leagueId },
          data: {
            prizeDistribution: JSON.stringify({ first, second, third })
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Distribuição de prêmios atualizada',
          league: {
            id: updatedLeague.id,
            prizeDistribution: updatedLeague.prizeDistribution
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in prizes POST API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
