import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/competition/snapshot
 *
 * Gera snapshot diário de pontuações para histórico
 * ✅ REFATORADO: Usa UserTeam em vez de Team (legacy)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { competitionId } = body;

    console.log('📸 Iniciando snapshot da competição...', { competitionId });

    if (!competitionId) {
      return NextResponse.json(
        { error: 'competitionId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a competição existe
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Competição não encontrada' },
        { status: 404 }
      );
    }

    // ✅ NOVO: Buscar UserTeams da competição
    const userTeams = await prisma.userTeam.findMany({
      where: {
        competitionId: competitionId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            publicKey: true
          }
        }
      }
    });

    console.log(`📊 Encontrados ${userTeams.length} times para pontuação`);

    if (userTeams.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum time encontrado na competição' },
        { status: 404 }
      );
    }

    // ============================================================
    // BUSCAR DADOS REAIS DO COINGECKO (change_7d)
    // ============================================================
    console.log('🌐 Buscando dados do mercado do CoinGecko...');

    const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&price_change_percentage=7d';

    let tokenChangeMap = new Map<string, number>(); // symbol -> change_7d

    try {
      const response = await fetch(COINGECKO_URL, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoFantasy-League/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Preencher o mapa com os dados reais
        data.forEach((token: any) => {
          const symbol = token.symbol.toUpperCase();
          const change7d = token.price_change_percentage_7d_in_currency || 0;
          tokenChangeMap.set(symbol, change7d);
        });

        console.log(`✅ Dados do CoinGecko carregados: ${tokenChangeMap.size} tokens`);
      } else {
        console.warn(`⚠️ CoinGecko API não disponível (status ${response.status}). Usando valores padrão 0.`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados do CoinGecko:', error);
      console.log('⚠️ Continuando com valores padrão 0 para todos os tokens.');
    }

    // ============================================================
    // CALCULAR PONTUAÇÕES DOS TIMES (SOMA DOS change_7d)
    // ============================================================
    const teamsWithScores = userTeams.map(userTeam => {
      console.log(`\n🎯 Calculando pontuação para: ${userTeam.teamName}`);

      // ✅ IMPORTANTE: players já é JSON, não precisa de parse
      const teamTokens = userTeam.players as string[];

      if (teamTokens.length === 0) {
        console.log(`⚠️ Time ${userTeam.teamName} sem tokens válidos`);
        return {
          ...userTeam,
          totalScore: 0
        };
      }

      let totalTeamPoints = 0;

      // Calcular pontos para cada token do time (usando change_7d real)
      teamTokens.forEach((tokenSymbol, index) => {
        const change7d = tokenChangeMap.get(tokenSymbol.toUpperCase()) || 0;
        totalTeamPoints += change7d;

        console.log(`   ${index + 1}. ${tokenSymbol}: ${change7d > 0 ? '+' : ''}${change7d.toFixed(2)}%`);
      });

      // Pontuação final = soma direta dos percentuais
      const totalScore = totalTeamPoints;

      console.log(`   📊 Total: ${totalScore.toFixed(2)} pontos (soma dos change_7d)`);

      return {
        ...userTeam,
        totalScore: Math.round(totalScore * 100) / 100 // Arredondar para 2 casas decimais
      };
    });

    // Ordenar por pontuação (decrescente)
    teamsWithScores.sort((a, b) => b.totalScore - a.totalScore);

    console.log('🏆 Ranking calculado:');
    teamsWithScores.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.teamName}: ${team.totalScore} pontos`);
    });

    // ✅ NOVO: Atualizar totalPoints em UserTeam (SEM rank)
    for (let i = 0; i < teamsWithScores.length; i++) {
      const team = teamsWithScores[i];

      await prisma.userTeam.update({
        where: { id: team.id },
        data: {
          totalPoints: team.totalScore
          // ✅ IMPORTANTE: Não salvamos rank no banco (calculado em runtime)
        }
      });
    }

    // Calcular estatísticas da rodada
    const avgScore = teamsWithScores.reduce((sum, team) => sum + team.totalScore, 0) / teamsWithScores.length;
    const maxScore = Math.max(...teamsWithScores.map(team => team.totalScore));
    const minScore = Math.min(...teamsWithScores.map(team => team.totalScore));

    console.log(`\n📈 Estatísticas da rodada:`);
    console.log(`   🎯 Pontuação média: ${avgScore.toFixed(2)}`);
    console.log(`   🏆 Maior pontuação: ${maxScore}`);
    console.log(`   📉 Menor pontuação: ${minScore}`);

    return NextResponse.json({
      success: true,
      message: 'Snapshot da competição realizado com sucesso',
      stats: {
        totalTeams: teamsWithScores.length,
        averageScore: Math.round(avgScore * 100) / 100,
        maxScore,
        minScore
      },
      ranking: teamsWithScores.map((team, index) => ({
        rank: index + 1, // ✅ Rank calculado em runtime
        teamName: team.teamName,
        totalScore: team.totalScore,
        user: team.user.name
      }))
    });

  } catch (error) {
    console.error('❌ Erro no snapshot:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
