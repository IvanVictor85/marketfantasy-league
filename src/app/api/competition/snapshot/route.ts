import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leagueId } = body;

    console.log('📸 Iniciando snapshot da competição...', { leagueId });

    // Buscar liga (principal se não especificada)
    let mainLeague;
    if (leagueId) {
      mainLeague = await prisma.league.findUnique({
        where: { id: leagueId }
      });
    } else {
      mainLeague = await prisma.league.findFirst({
        where: {
          leagueType: 'MAIN',
          isActive: true
        }
      });
    }

    if (!mainLeague) {
      return NextResponse.json(
        { error: 'Liga principal não encontrada' },
        { status: 404 }
      );
    }

    // Buscar todos os times da liga
    const teams = await prisma.team.findMany({
      where: {
        leagueId: mainLeague.id,
        hasValidEntry: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Encontrados ${teams.length} times para pontuação`);

    if (teams.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum time encontrado na liga' },
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
    const teamsWithScores = teams.map(team => {
      console.log(`\n🎯 Calculando pontuação para: ${team.teamName}`);

      // Parse dos tokens do time
      let teamTokens: string[] = [];
      try {
        teamTokens = JSON.parse(team.tokens);
      } catch (error) {
        console.error(`❌ Erro ao parsear tokens do time ${team.teamName}:`, error);
        teamTokens = [];
      }

      if (teamTokens.length === 0) {
        console.log(`⚠️ Time ${team.teamName} sem tokens válidos`);
        return {
          ...team,
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

      // Pontuação final = soma direta dos percentuais (Opção 2a)
      const totalScore = totalTeamPoints;

      console.log(`   📊 Total: ${totalScore.toFixed(2)} pontos (soma dos change_7d)`);

      return {
        ...team,
        totalScore: Math.round(totalScore * 100) / 100 // Arredondar para 2 casas decimais
      };
    });
    
    // Ordenar por pontuação (decrescente)
    teamsWithScores.sort((a, b) => b.totalScore - a.totalScore);
    
    console.log('🏆 Ranking calculado:');
    teamsWithScores.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.teamName}: ${team.totalScore} pontos`);
    });
    
    // Atualizar times no banco com pontuação e ranking
    for (let i = 0; i < teamsWithScores.length; i++) {
      const team = teamsWithScores[i];
      const rank = i + 1;
      
      await prisma.team.update({
        where: { id: team.id },
        data: {
          totalScore: team.totalScore,
          rank: rank
        }
      });
    }
    
    // Atualizar estatísticas da liga
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
        rank: index + 1,
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
