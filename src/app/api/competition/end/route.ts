import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  createEndSnapshot,
  calculateAllScores,
  updateRankings,
  determineWinners,
  canEndCompetition
} from '@/lib/competition/manager';
import { getTop100Tokens } from '@/lib/services/coingecko.service';

// ============================================
// VALIDATION SCHEMA
// ============================================

const endCompetitionSchema = z.object({
  competitionId: z.string().min(1, 'Competition ID is required')
});

// ============================================
// POST /api/competition/end
// ============================================

/**
 * Finaliza uma competição:
 * - Valida que a competição está active
 * - Cria snapshot de preços finais
 * - Calcula pontuações de todos os times
 * - Atualiza rankings
 * - Determina vencedores e prêmios
 * - Muda status para completed
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🏁 API /api/competition/end: Finalizando competição...');

    // Parse e validar body
    const body = await request.json();
    const { competitionId } = endCompetitionSchema.parse(body);

    console.log(`📋 Competition ID: ${competitionId}`);

    // Verificar se a competição existe
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: {
          include: {
            teams: true
          }
        }
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
    if (competition.status !== 'active') {
      console.log(`❌ Competição não está ativa. Status atual: ${competition.status}`);
      return NextResponse.json(
        {
          error: `Competição não pode ser finalizada. Status atual: ${competition.status}`,
          currentStatus: competition.status
        },
        { status: 400 }
      );
    }

    // Verificar se pode finalizar (horário)
    const canEnd = await canEndCompetition(competitionId);
    if (!canEnd) {
      const now = new Date();
      const timeUntilEnd = competition.endTime.getTime() - now.getTime();

      console.log(`⏰ Ainda não é hora de finalizar. Faltam ${Math.floor(timeUntilEnd / 1000)}s`);

      return NextResponse.json(
        {
          error: 'Competição ainda não pode ser finalizada',
          endTime: competition.endTime,
          timeUntilEnd: timeUntilEnd
        },
        { status: 400 }
      );
    }

    console.log(`👥 Times participantes: ${competition.league.teams.length}`);

    // ETAPA 1: Criar snapshot de preços finais
    console.log('📸 ETAPA 1: Criando snapshot de preços finais...');
    const snapshot = await createEndSnapshot(competitionId);
    console.log(`✅ Snapshot criado: ${snapshot.length} tokens`);

    // ETAPA 2: Calcular pontuações
    console.log('🧮 ETAPA 2: Calculando pontuações dos times...');
    const teamScores = await calculateAllScores(competitionId);
    console.log(`✅ Pontuações calculadas: ${teamScores.length} times`);

    // ETAPA 3: Atualizar rankings
    console.log('🏆 ETAPA 3: Atualizando rankings...');
    await updateRankings(competitionId);
    console.log('✅ Rankings atualizados');

    // ETAPA 4: Determinar vencedores
    console.log('🎯 ETAPA 4: Determinando vencedores e prêmios...');
    const winners = await determineWinners(competitionId);
    console.log(`✅ Vencedores determinados: ${winners.length} times premiados`);

    // ETAPA 5: Atualizar status da competição
    console.log('💾 ETAPA 5: Atualizando status da competição...');
    const updatedCompetition = await prisma.competition.update({
      where: { id: competitionId },
      data: {
        status: 'completed',
        distributed: false, // Prêmios ainda não distribuídos na blockchain
        updatedAt: new Date()
      }
    });
    console.log('✅ Status atualizado para completed');

    // ETAPA 6: Criar próxima competição e salvar Top 100 tokens
    console.log('🔄 ETAPA 6: Criando próxima competição e salvando cardápio...');

    try {
      // Buscar Top 100 tokens da CoinGecko
      console.log('🌐 Buscando Top 100 tokens da CoinGecko...');
      const top100Tokens = await getTop100Tokens();
      console.log(`✅ Top 100 tokens obtidos: ${top100Tokens.length} tokens`);

      // Calcular horários da próxima competição (baseado no fluxo SEX-DOM)
      const now = new Date(competition.endTime); // Este é Sexta-feira, 21h

      // O próximo draft começa agora, mas a próxima *competição* começa em 2 dias
      const nextStartTime = new Date(now);
      nextStartTime.setDate(now.getDate() + 2); // Sexta + 2 dias = Domingo 21h

      // A próxima competição termina 5 dias após o início
      const nextEndTime = new Date(nextStartTime);
      nextEndTime.setDate(nextStartTime.getDate() + 5); // Domingo + 5 dias = Próxima Sexta 21h

      console.log(`📅 Próxima competição: Início (Domingo) ${nextStartTime.toISOString()} → Fim (Sexta) ${nextEndTime.toISOString()}`);

      // Criar próxima competição
      const nextCompetition = await prisma.competition.create({
        data: {
          leagueId: competition.leagueId,
          startTime: nextStartTime,
          endTime: nextEndTime,
          status: 'pending',
          prizePool: 0, // Será atualizado conforme entradas pagas
          distributed: false
        }
      });

      console.log(`✅ Próxima competição criada: ${nextCompetition.id}`);

      // Salvar os 100 tokens no banco
      console.log('💾 Salvando cardápio de tokens no banco...');

      const tokensToCreate = top100Tokens.map(token => ({
        competitionId: nextCompetition.id,
        tokenId: token.id,
        symbol: token.symbol,
        name: token.name,
        imageUrl: token.image,
        marketCapRank: token.market_cap_rank
      }));

      await prisma.competitionToken.createMany({
        data: tokensToCreate,
        skipDuplicates: true
      });

      console.log(`✅ Cardápio salvo: ${tokensToCreate.length} tokens disponíveis para draft`);
      console.log(`   🔒 Cardápio TRAVADO até ${nextEndTime.toISOString()}`);

    } catch (error) {
      console.error('⚠️ Erro ao criar próxima competição:', error);
      // Não falhar o endpoint inteiro se isso der erro
      // A competição atual foi finalizada com sucesso
    }

    // Buscar rankings atualizados
    const rankings = await prisma.team.findMany({
      where: {
        leagueId: competition.leagueId
      },
      orderBy: {
        rank: 'asc'
      },
      select: {
        id: true,
        teamName: true,
        userWallet: true,
        rank: true,
        totalScore: true,
        tokens: true
      }
    });

    const duration = Date.now() - startTime;

    console.log(`✅ Competição finalizada com sucesso em ${duration}ms`);
    console.log(`🏆 Top 3:`);
    winners.forEach(w => {
      console.log(`  ${w.position}º ${w.teamName}: ${w.totalScore.toFixed(2)}% - ${w.prize} SOL`);
    });

    return NextResponse.json({
      success: true,
      message: 'Competição finalizada com sucesso',
      competition: {
        id: updatedCompetition.id,
        status: updatedCompetition.status,
        startTime: updatedCompetition.startTime,
        endTime: updatedCompetition.endTime,
        prizePool: updatedCompetition.prizePool,
        distributed: updatedCompetition.distributed,
        teamsCount: competition.league.teams.length
      },
      snapshot: {
        tokensCount: snapshot.length
      },
      winners: winners.map(w => ({
        position: w.position,
        teamId: w.teamId,
        teamName: w.teamName,
        userWallet: w.userWallet,
        totalScore: Number(w.totalScore.toFixed(2)),
        prize: w.prize
      })),
      rankings: rankings.map(r => ({
        rank: r.rank,
        teamName: r.teamName,
        userWallet: r.userWallet,
        totalScore: Number((r.totalScore || 0).toFixed(2))
      })),
      duration
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao finalizar competição:', error);

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
        error: 'Erro interno ao finalizar competição',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
