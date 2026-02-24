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
import { getTop100TokensWithSWR } from '@/lib/services/cache';
import { onReferredUserWon } from '@/lib/referral-service';

// ============================================
// VALIDATION SCHEMA
// ============================================

const endCompetitionSchema = z.object({
  competitionId: z.string().min(1, 'Competition ID is required'),
  skipTimeValidation: z.boolean().optional()  // Para testes locais
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
    const { competitionId, skipTimeValidation } = endCompetitionSchema.parse(body);

    console.log(`📋 Competition ID: ${competitionId}`);
    if (skipTimeValidation) {
      console.log('⚠️  Modo de teste: Validação de horário desabilitada');
    }

    // Verificar se a competição existe
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: true // ✅ Removido include de teams (legacy)
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
    if (competition.status !== 'ACTIVE') {  // ✅ CORREÇÃO: Status maiúsculo
      console.log(`❌ Competição não está ativa. Status atual: ${competition.status}`);
      return NextResponse.json(
        {
          error: `Competição não pode ser finalizada. Status atual: ${competition.status}`,
          currentStatus: competition.status
        },
        { status: 400 }
      );
    }

    // Verificar se pode finalizar (horário) - EXCETO em modo de teste
    if (!skipTimeValidation) {
      const canEnd = await canEndCompetition(competitionId);
      if (!canEnd) {
        const now = new Date();
        const timeUntilEnd = competition.endDate.getTime() - now.getTime();

        console.log(`⏰ Ainda não é hora de finalizar. Faltam ${Math.floor(timeUntilEnd / 1000)}s`);

        return NextResponse.json(
          {
            error: 'Competição ainda não pode ser finalizada',
            endDate: competition.endDate,
            timeUntilEnd: timeUntilEnd
          },
          { status: 400 }
        );
      }
    }

    // ✅ NOVO: Contar UserTeams da competição
    const teamsCount = await prisma.userTeam.count({
      where: { competitionId }
    });

    console.log(`👥 Times participantes: ${teamsCount}`);

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

    // 🎯 REFERRAL: Dar pontos para quem indicou os vencedores (FIRST_WIN)
    for (const winner of winners) {
      try {
        // Buscar userId do vencedor pelo teamId
        const winnerTeam = await prisma.userTeam.findUnique({
          where: { id: winner.teamId },
          select: { userId: true }
        });
        if (winnerTeam) {
          await onReferredUserWon(winnerTeam.userId, competitionId);
        }
      } catch (refError) {
        console.error('⚠️ Erro ao processar FIRST_WIN referral:', refError);
      }
    }

    // ETAPA 5: Atualizar status da competição
    console.log('💾 ETAPA 5: Atualizando status da competição...');
    const updatedCompetition = await prisma.competition.update({
      where: { id: competitionId },
      data: {
        status: 'COMPLETED',
        distributed: false, // Prêmios ainda não distribuídos na blockchain
        updatedAt: new Date()
      }
    });
    console.log('✅ Status atualizado para completed');

    // ETAPA 6: Atualizar SeasonRanking (pontos acumulados da temporada)
    console.log('📊 ETAPA 6: Atualizando rankings da temporada (Season)...');

    if (competition.seasonId) {
      try {
        // Buscar todos os times da competição com suas pontuações finais
        const userTeams = await prisma.userTeam.findMany({
          where: { competitionId: competitionId },
          select: {
            userId: true,
            totalPoints: true
          }
        });

        console.log(`   Atualizando ${userTeams.length} usuários na Season ${competition.seasonId}...`);

        // Atualizar SeasonRanking para cada usuário
        for (const team of userTeams) {
          await prisma.seasonRanking.upsert({
            where: {
              userId_seasonId: {
                userId: team.userId,
                seasonId: competition.seasonId
              }
            },
            update: {
              // Incrementar pontos totais da temporada
              totalSeasonPoints: {
                increment: Number(team.totalPoints)
              },
              updatedAt: new Date()
            },
            create: {
              userId: team.userId,
              seasonId: competition.seasonId,
              totalSeasonPoints: Number(team.totalPoints)
            }
          });
        }

        console.log(`✅ SeasonRanking atualizado para ${userTeams.length} usuários`);
      } catch (error) {
        console.error('⚠️ Erro ao atualizar SeasonRanking:', error);
        // Não falhar o endpoint se isso der erro
      }
    } else {
      console.log('⚠️ Competição não está linkada a uma Season - pulando atualização de ranking');
    }

    // ETAPA 7: Criar próxima competição e salvar Top 100 tokens
    // ⚠️ DESABILITADO: Criação automática removida (rodadas são criadas manualmente)
    console.log('⏭️  ETAPA 7: Criação automática de próxima competição DESABILITADA');

    // ❌ CÓDIGO ANTIGO COMENTADO (fluxo SEX-DOM de 5 dias não é mais usado)
    /*
    try {
      // Buscar Top 100 tokens da CoinGecko
      console.log('🌐 Buscando Top 100 tokens da CoinGecko...');
      const top100Tokens = await getTop100Tokens();

      // ✅ VERIFICAR SE COINGECKO RETORNOU DADOS
      if (!top100Tokens || top100Tokens.length === 0) {
        console.error('❌ CoinGecko retornou array vazio - não foi possível criar próxima competição');
        throw new Error('CoinGecko API indisponível - não foi possível obter Top 100 tokens');
      }

      console.log(`✅ Top 100 tokens obtidos: ${top100Tokens.length} tokens`);

      // Calcular horários da próxima competição (baseado no fluxo SEX-DOM)
      const now = new Date(competition.endDate); // Este é Sexta-feira, 21h

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
          startDate: nextStartTime,
          endDate: nextEndTime,
          status: 'PENDING',
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
    */

    // ✅ NOVO: Buscar rankings de UserTeam (ordenado por totalPoints)
    const userTeams = await prisma.userTeam.findMany({
      where: {
        competitionId: competitionId
      },
      include: {
        user: {
          select: {
            publicKey: true,
            name: true
          }
        }
      },
      orderBy: {
        totalPoints: 'desc'
      }
    });

    // ✅ IMPORTANTE: Calcular rank em runtime
    const rankings = userTeams.map((team, index) => ({
      rank: index + 1,
      teamName: team.teamName,
      userWallet: team.user.publicKey,
      totalScore: Number(team.totalPoints) || 0,
      tokens: team.players as string[]
    }));

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
        startDate: updatedCompetition.startDate,
        endDate: updatedCompetition.endDate,
        prizePool: updatedCompetition.prizePool,
        distributed: updatedCompetition.distributed,
        teamsCount: teamsCount // ✅ Usando count de UserTeam
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
        rank: r.rank, // ✅ Já calculado em runtime
        teamName: r.teamName,
        userWallet: r.userWallet,
        totalScore: Number(r.totalScore.toFixed(2))
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
