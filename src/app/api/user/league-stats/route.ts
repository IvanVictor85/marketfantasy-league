import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Função para obter o usuário autenticado
async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) return null;

    const authToken = await prisma.authToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!authToken || authToken.expiresAt < new Date()) return null;

    return authToken.userId;
  } catch (error) {
    console.error('❌ [AUTH] Erro ao obter usuário:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get('leagueId');

    console.log('📊 [LEAGUE-STATS] Buscando estatísticas:', { userId, leagueId });

    if (!leagueId) {
      return NextResponse.json({ error: 'leagueId é obrigatório' }, { status: 400 });
    }

    // ✅ CORREÇÃO: Buscar competições diretamente por leagueId
    // Competition tem leagueId (não Season), então consultamos Competition primeiro
    const competitions = await prisma.competition.findMany({
      where: {
        leagueId,
        // Opcionalmente podemos filtrar apenas competições ativas/completas
        // status: { in: ['ACTIVE', 'COMPLETED'] }
      },
      select: {
        id: true,
        seasonId: true,
        status: true
      },
      orderBy: { startDate: 'desc' }
    });

    const competitionIds = competitions.map(c => c.id);

    console.log('📊 [LEAGUE-STATS] Competições encontradas para leagueId:', {
      leagueId,
      total: competitionIds.length,
      competitions: competitions.map(c => ({ id: c.id, seasonId: c.seasonId, status: c.status }))
    });

    if (competitionIds.length === 0) {
      console.log('⚠️ [LEAGUE-STATS] Nenhuma competição encontrada, retornando zeros');
      return NextResponse.json({
        totalScore: 0,
        rank: null
      });
    }

    // Buscar todos os times do usuário nessas competições
    const userTeams = await prisma.userTeam.findMany({
      where: {
        userId,
        competitionId: { in: competitionIds }
      },
      select: {
        totalPoints: true
      }
    });

    console.log('📊 [LEAGUE-STATS] Times do usuário encontrados:', userTeams.length);

    // Calcular pontuação total do usuário
    const totalScore = userTeams.reduce((sum, team) => sum + (Number(team.totalPoints) || 0), 0);

    console.log('📊 [LEAGUE-STATS] Pontuação total calculada:', totalScore);

    // Calcular ranking: buscar todos os usuários e suas pontuações totais
    const allUsers = await prisma.userTeam.groupBy({
      by: ['userId'],
      where: {
        competitionId: { in: competitionIds }
      },
      _sum: {
        totalPoints: true
      }
    });

    console.log('📊 [LEAGUE-STATS] Total de usuários na liga:', allUsers.length);

    // Ordenar por pontuação total decrescente
    const rankedUsers = allUsers
      .map(u => ({
        userId: u.userId,
        totalScore: Number(u._sum.totalPoints) || 0
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    // Encontrar a posição do usuário
    const userRank = rankedUsers.findIndex(u => u.userId === userId) + 1;

    console.log('📊 [LEAGUE-STATS] Ranking do usuário:', userRank);

    return NextResponse.json({
      totalScore,
      rank: userRank > 0 ? userRank : null
    });

  } catch (error) {
    console.error('❌ [LEAGUE-STATS] Erro ao buscar estatísticas da liga:', error);
    console.error('❌ [LEAGUE-STATS] Stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json({
      error: 'Erro ao buscar estatísticas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
