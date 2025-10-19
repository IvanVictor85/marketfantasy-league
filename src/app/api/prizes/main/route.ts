import { NextRequest, NextResponse } from 'next/server';
import { PrizeService } from '@/lib/prize-service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Buscar a Liga Principal
    const mainLeague = await prisma.league.findFirst({
      where: { 
        leagueType: 'MAIN',
        isActive: true 
      }
    });

    if (!mainLeague) {
      return NextResponse.json(
        { error: 'Liga Principal não encontrada' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'calculate':
        // Calcular distribuição de prêmios da liga principal
        const distribution = await PrizeService.calculatePrizeDistribution(mainLeague.id);
        
        return NextResponse.json({
          success: true,
          league: {
            id: mainLeague.id,
            name: mainLeague.name,
            totalPrizePool: mainLeague.totalPrizePool,
            entryFee: mainLeague.entryFee,
            participantCount: mainLeague.participantCount
          },
          distribution,
          timestamp: new Date().toISOString()
        });

      case 'simulate':
        // Simular distribuição de prêmios
        const simulatedDistribution = await PrizeService.simulatePrizeDistribution(mainLeague.id);
        
        return NextResponse.json({
          success: true,
          league: {
            id: mainLeague.id,
            name: mainLeague.name,
            totalPrizePool: mainLeague.totalPrizePool
          },
          distribution: simulatedDistribution,
          simulated: true,
          timestamp: new Date().toISOString()
        });

      case 'history':
        // Obter histórico de prêmios
        const history = await PrizeService.getPrizeHistory(mainLeague.id);
        
        return NextResponse.json({
          success: true,
          league: {
            id: mainLeague.id,
            name: mainLeague.name
          },
          history,
          timestamp: new Date().toISOString()
        });

      case 'validate':
        // Validar se pode distribuir prêmios
        const validation = await PrizeService.canDistributePrizes(mainLeague.id);
        
        return NextResponse.json({
          success: true,
          league: {
            id: mainLeague.id,
            name: mainLeague.name,
            isActive: mainLeague.isActive,
            endDate: mainLeague.endDate
          },
          validation,
          timestamp: new Date().toISOString()
        });

      default:
        // Por padrão, calcular distribuição
        const defaultDistribution = await PrizeService.calculatePrizeDistribution(mainLeague.id);
        
        return NextResponse.json({
          success: true,
          league: {
            id: mainLeague.id,
            name: mainLeague.name,
            totalPrizePool: mainLeague.totalPrizePool,
            entryFee: mainLeague.entryFee,
            participantCount: mainLeague.participantCount,
            prizeDistribution: mainLeague.prizeDistribution
          },
          distribution: defaultDistribution,
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Error in main league prizes API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Buscar a Liga Principal
    const mainLeague = await prisma.league.findFirst({
      where: { 
        leagueType: 'MAIN',
        isActive: true 
      }
    });

    if (!mainLeague) {
      return NextResponse.json(
        { error: 'Liga Principal não encontrada' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'distribute':
        // Distribuir prêmios da liga principal
        const validation = await PrizeService.canDistributePrizes(mainLeague.id);
        
        if (!validation.canDistribute) {
          return NextResponse.json(
            { 
              success: false, 
              error: validation.reason,
              canDistribute: false,
              league: {
                id: mainLeague.id,
                name: mainLeague.name,
                isActive: mainLeague.isActive,
                endDate: mainLeague.endDate
              }
            },
            { status: 400 }
          );
        }

        const distribution = await PrizeService.calculatePrizeDistribution(mainLeague.id);
        
        // Registrar distribuição no banco
        await PrizeService.recordPrizeDistribution(distribution);
        
        return NextResponse.json({
          success: true,
          message: 'Prêmios da Liga Principal distribuídos com sucesso',
          league: {
            id: mainLeague.id,
            name: mainLeague.name,
            totalPrizePool: mainLeague.totalPrizePool
          },
          distribution,
          timestamp: new Date().toISOString()
        });

      case 'simulate-distribution':
        // Simular distribuição completa da liga principal
        const simulatedDistribution = await PrizeService.simulatePrizeDistribution(mainLeague.id);
        
        // Registrar simulação no banco
        await PrizeService.recordPrizeDistribution(simulatedDistribution);
        
        return NextResponse.json({
          success: true,
          message: 'Simulação de distribuição da Liga Principal realizada',
          league: {
            id: mainLeague.id,
            name: mainLeague.name,
            totalPrizePool: mainLeague.totalPrizePool
          },
          distribution: simulatedDistribution,
          simulated: true,
          timestamp: new Date().toISOString()
        });

      case 'update-distribution':
        // Atualizar percentuais de distribuição da liga principal
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
          where: { id: mainLeague.id },
          data: {
            prizeDistribution: JSON.stringify({ first, second, third })
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Distribuição de prêmios da Liga Principal atualizada',
          league: {
            id: updatedLeague.id,
            name: updatedLeague.name,
            prizeDistribution: updatedLeague.prizeDistribution,
            totalPrizePool: updatedLeague.totalPrizePool
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
    console.error('Error in main league prizes POST API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
