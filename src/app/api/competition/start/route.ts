import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createStartSnapshot, canStartCompetition } from '@/lib/competition/manager';

// ============================================
// VALIDATION SCHEMA
// ============================================

const startCompetitionSchema = z.object({
  competitionId: z.string().min(1, 'Competition ID is required'),
  skipTimeValidation: z.boolean().optional()  // Para testes locais
});

// ============================================
// POST /api/competition/start
// ============================================

/**
 * Inicia uma competição:
 * - Valida que a competição está pending
 * - Cria snapshot de preços iniciais
 * - Muda status para active
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🚀 API /api/competition/start: Iniciando competição...');

    // Parse e validar body
    const body = await request.json();
    const { competitionId, skipTimeValidation } = startCompetitionSchema.parse(body);

    console.log(`📋 Competition ID: ${competitionId}`);
    if (skipTimeValidation) {
      console.log('⚠️  Modo de teste: Validação de horário desabilitada');
    }

    // Verificar se a competição existe
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: true,
        userTeams: true  // ✅ CORREÇÃO: Times estão em UserTeam, não em League.teams
      }
    });

    if (!competition) {
      console.log('❌ Competição não encontrada');
      return NextResponse.json(
        { error: 'Competição não encontrada' },
        { status: 404 }
      );
    }

    // Validar status
    if (competition.status !== 'PENDING') {  // ✅ CORREÇÃO: Status é maiúsculo no schema
      console.log(`❌ Competição já está em status: ${competition.status}`);
      return NextResponse.json(
        {
          error: `Competição não pode ser iniciada. Status atual: ${competition.status}`,
          currentStatus: competition.status
        },
        { status: 400 }
      );
    }

    // Verificar se pode iniciar (horário) - EXCETO em modo de teste
    if (!skipTimeValidation) {
      const canStart = await canStartCompetition(competitionId);
      if (!canStart) {
        const now = new Date();
        const timeUntilStart = competition.startDate.getTime() - now.getTime();

        console.log(`⏰ Ainda não é hora de iniciar. Faltam ${Math.floor(timeUntilStart / 1000)}s`);

        return NextResponse.json(
          {
            error: 'Competição ainda não pode ser iniciada',
            startDate: competition.startDate,
            timeUntilStart: timeUntilStart
          },
          { status: 400 }
        );
      }
    }

    // Verificar se há times participantes
    if (competition.userTeams.length === 0) {
      console.log('⚠️ Nenhum time registrado na competição');
      return NextResponse.json(
        {
          error: 'Não há times participantes nesta competição',
          teamsCount: 0
        },
        { status: 400 }
      );
    }

    console.log(`👥 Times participantes: ${competition.userTeams.length}`);

    // Criar snapshot de preços iniciais
    console.log('📸 Criando snapshot de preços...');
    const snapshot = await createStartSnapshot(competitionId);

    // Atualizar status da competição para active
    const updatedCompetition = await prisma.competition.update({
      where: { id: competitionId },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });

    const duration = Date.now() - startTime;

    console.log(`✅ Competição iniciada com sucesso em ${duration}ms`);
    console.log(`📊 Snapshot: ${snapshot.length} tokens`);

    return NextResponse.json({
      success: true,
      message: 'Competição iniciada com sucesso',
      competition: {
        id: updatedCompetition.id,
        status: updatedCompetition.status,
        startDate: updatedCompetition.startDate,
        endDate: updatedCompetition.endDate,
        prizePool: updatedCompetition.prizePool,
        teamsCount: competition.userTeams.length
      },
      snapshot: {
        tokensCount: snapshot.length,
        tokens: snapshot.map(s => ({
          symbol: s.symbol,
          price: s.price
        }))
      },
      duration
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar competição:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro interno ao iniciar competição',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
