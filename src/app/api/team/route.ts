import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validateTokens } from '@/lib/valid-tokens'
import { isRodadaEmAndamento } from '@/lib/utils/timeCheck'
import {
  getMarketDataWithFallback,
  ensureCachePopulated,
} from '@/lib/services/cache'
import { rateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic';

// 🔒 SEGURANÇA: Schema atualizado para aceitar competitionId opcional
const teamSchema = z.object({
  leagueId: z.string().optional(),
  competitionId: z.string().optional(), // ✅ Novo campo para vínculo com rodada
  teamName: z.string().min(1, 'Team name is required').max(50, 'Team name too long'),
  tokens: z.array(z.string()).length(10, 'Team must have exactly 10 tokens')
})

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

// Helper para formatar resposta do CoinGecko consistentemente
function mapMarketDataToResponse(marketData: any[], tokens: string[]) {
  if (!marketData || marketData.length === 0) {
    return tokens.map(s => ({
      id: `unknown-${s}`,
      symbol: s,
      name: s,
      image: '/icons/coinx.svg',
      currentPrice: 0,
      priceChange1h: 0,
      priceChange24h: 0,
      priceChange7d: 0,
      marketCap: 0,
      marketCapRank: null
    }));
  }

  return marketData.map(t => ({
    id: t.id,
    symbol: t.symbol,
    name: t.name,
    image: t.image || '',
    currentPrice: t.current_price || 0,
    priceChange1h: t.price_change_percentage_1h_in_currency || 0,
    priceChange24h: t.price_change_percentage_24h || 0,
    priceChange7d: t.price_change_percentage_7d_in_currency || 0,
    marketCap: t.market_cap || 0,
    marketCapRank: t.market_cap_rank || null
  }));
}

export async function POST(request: NextRequest) {
  // 🔒 RATE LIMITING
  const rateLimitResult = await rateLimit(request, RATE_LIMITS.AUTHENTICATED);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.reset);

  console.log('🚀 API team POST: Iniciando salvamento de time...');

  try {
    // 🔒 VERIFICAÇÃO DE HORÁRIO
    if (isRodadaEmAndamento()) {
      console.log('🚫 API team POST: Rodada em Andamento - edição bloqueada');
      return NextResponse.json(
        { error: 'Rodada em Andamento. A edição está bloqueada entre 21:00 e 09:00 (Horário de Brasília).' },
        { status: 403 }
      );
    }

    const userId = await getUserFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });

    // 🔒 SEGURANÇA: Buscar wallet do banco
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { publicKey: true, email: true }
    });

    if (!user || !user.publicKey) {
      return NextResponse.json({ error: 'Você precisa conectar uma carteira antes de criar um time' }, { status: 400 });
    }

    const userWallet = user.publicKey;
    const body = await request.json();

    // Parse com o novo schema
    const { leagueId, competitionId, teamName, tokens } = teamSchema.parse(body);

    console.log('✅ API team POST: Dados recebidos:', { userId, leagueId, competitionId, tokensLength: tokens.length });

    // Validar 10 tokens únicos
    if (tokens.length !== 10) {
      return NextResponse.json({ error: `Time deve ter exatamente 10 tokens.`, requiresPayment: false }, { status: 400 });
    }
    const uniqueTokens = new Set(tokens);
    if (uniqueTokens.size !== 10) {
      return NextResponse.json({ error: 'Não pode haver tokens duplicados', requiresPayment: false }, { status: 400 });
    }

    // 🎯 CASO: Template
    if (leagueId === 'main_template') {
      console.log('📋 API team POST: Salvando Time Principal (Template)');
      await prisma.user.update({
        where: { id: userId },
        data: { mainTeam: tokens }
      });

      // Buscar dados de mercado (com dedupe)
      const marketData = await getMarketDataWithFallback(tokens);
      const tokenDetails = mapMarketDataToResponse(marketData, tokens);

      return NextResponse.json({
        success: true,
        message: 'Time Principal salvo com sucesso!',
        team: { id: 'main_template', name: teamName, tokens, hasValidEntry: true },
        tokenDetails
      });
    }

    // 🎯 CASO: Liga / Competição Real
    let league;
    if (leagueId && leagueId !== 'main-league') {
      league = await prisma.league.findUnique({ where: { id: leagueId } });
    } else {
      league = await prisma.league.findFirst({
        where: { name: { contains: 'Principal', mode: 'insensitive' } }
      });
    }

    if (!league) return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });

    console.log(`🔍 API team POST: Liga encontrada: ${league.id}`);

    // ✅ CRUCIAL: Determinar o ID da Competição (Rodada)
    let targetCompetitionId = competitionId;

    if (!targetCompetitionId) {
      console.log(`🔍 API team POST: competitionId não informado. Buscando rodada ativa para liga ${league.id}...`);
      const activeComp = await prisma.competition.findFirst({
        where: {
          leagueId: league.id,
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' }
      });

      if (activeComp) {
        targetCompetitionId = activeComp.id;
        console.log(`✅ API team POST: Rodada ativa encontrada: ${targetCompetitionId}`);
      } else {
        return NextResponse.json({
          error: 'Nenhuma rodada ativa encontrada. Aguarde o início da próxima rodada.'
        }, { status: 400 });
      }
    }

    // 🔒 Verificar pagamento/entrada (por rodada específica)
    const leagueEntry = await prisma.leagueEntry.findFirst({
      where: {
        userId: userId,
        competitionId: targetCompetitionId,
        status: 'CONFIRMED'
      }
    });

    if (!leagueEntry) {
      return NextResponse.json({
        error: 'Pagamento da taxa de entrada não confirmado',
        requiresPayment: true,
        league: { id: league.id, name: league.name, entryFee: league.entryFee }
      }, { status: 402 });
    }

    // Validar tokens (allowlist)
    console.log('🔍 API team POST: Validando tokens:', tokens);
    const tokenValidation = validateTokens(tokens);
    if (!tokenValidation.valid) {
      console.error('❌ API team POST: Tokens inválidos encontrados:', tokenValidation.invalidTokens);
      return NextResponse.json({
        error: 'Tokens inválidos',
        invalidTokens: tokenValidation.invalidTokens
      }, { status: 400 });
    }
    console.log('✅ API team POST: Todos os tokens são válidos');

    // 💾 SALVAR NO BANCO usando UserTeam
    console.log(`💾 API team POST: Salvando time para Competição: ${targetCompetitionId}`);

    const userTeam = await prisma.userTeam.upsert({
      where: {
        userId_competitionId: {
          userId: userId,
          competitionId: targetCompetitionId
        }
      },
      update: {
        players: tokens,
        teamName: teamName,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        competitionId: targetCompetitionId,
        players: tokens,
        teamName: teamName
      }
    });

    console.log(`✅ API team POST: Time salvo com sucesso: ${userTeam.id}`);

    // Buscar dados de mercado (com dedupe)
    const marketData = await getMarketDataWithFallback(tokens);
    const tokenDetails = mapMarketDataToResponse(marketData, tokens);

    // Calcular ranking da rodada
    const allTeamsInCompetition = await prisma.userTeam.findMany({
      where: { competitionId: targetCompetitionId },
      select: {
        userId: true,
        totalPoints: true
      },
      orderBy: { totalPoints: 'desc' }
    });

    const userRank = allTeamsInCompetition.findIndex(t => t.userId === userId) + 1;

    return NextResponse.json({
      success: true,
      message: 'Time salvo com sucesso',
      team: {
        id: userTeam.id,
        name: userTeam.teamName,
        tokens: userTeam.players as string[],
        competitionId: userTeam.competitionId,
        totalPoints: userTeam.totalPoints,
        rank: userRank > 0 ? userRank : null,
        updatedAt: userTeam.updatedAt
      },
      tokenDetails
    });

  } catch (error) {
    console.error('Error managing team:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });

    // ✅ PERFORMANCE: Garantir que o cache de dedupe esteja populado antes de buscar dados de mercado
    // Isso evita CACHE_MISS → Rate Limit quando o servidor reinicia ou faz Hot Refresh
    await ensureCachePopulated();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { publicKey: true, mainTeam: true }
    });

    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const competitionIdParam = searchParams.get('competitionId');

    console.log('🔍 API team GET: Buscando time para:', { userId, leagueId, competitionIdParam });

    // 🔓 Lógica Sem Carteira (Visualização apenas)
    if (!user.publicKey) {
      return NextResponse.json({
        hasTeam: false,
        needsWallet: true,
        message: 'Conecte uma carteira para criar seu time'
      });
    }

    // 🎯 CASO: Template Principal
    if (leagueId === 'main_template') {
      console.log('📋 [TEAM-GET] Buscando time template...');

      if (!user.mainTeam) {
        return NextResponse.json({ hasTeam: false, isTemplate: true, message: 'Time principal vazio' });
      }

      let teamTokens: string[] = [];
      try {
        teamTokens = Array.isArray(user.mainTeam) ? user.mainTeam as string[] : JSON.parse(user.mainTeam as any);
      } catch (e) {
        teamTokens = [];
      }

      if (!teamTokens.length) {
        return NextResponse.json({ hasTeam: false, isTemplate: true });
      }

      // Buscar dados de mercado (com dedupe)
      const marketData = await getMarketDataWithFallback(teamTokens);
      const tokenDetails = mapMarketDataToResponse(marketData, teamTokens);

      return NextResponse.json({
        hasTeam: true,
        isTemplate: true,
        team: {
          id: 'main_template',
          name: 'Meu Time Principal',
          tokens: teamTokens,
          hasValidEntry: true
        },
        tokenDetails
      });
    }

    // 🎯 CASO: Liga / Rodada
    let league;
    if (leagueId && leagueId !== 'main-league') {
      league = await prisma.league.findUnique({ where: { id: leagueId } });
    } else {
      league = await prisma.league.findFirst({
        where: { name: { contains: 'Principal', mode: 'insensitive' } }
      });
    }

    if (!league) return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });

    // ✅ CRUCIAL: Determinar qual Competição (Rodada) buscar
    let targetCompetitionId = competitionIdParam;

    // Se não veio competitionId na URL, descobrir qual é a ativa
    if (!targetCompetitionId) {
      console.log(`🔍 [TEAM-GET] competitionId ausente. Buscando ACTIVE para liga ${league.id}`);
      const activeComp = await prisma.competition.findFirst({
        where: { leagueId: league.id, status: 'ACTIVE' },
        orderBy: { startDate: 'desc' }
      });

      if (activeComp) {
        targetCompetitionId = activeComp.id;
        console.log(`✅ [TEAM-GET] Usando rodada ativa: ${targetCompetitionId}`);
      } else {
        return NextResponse.json({
          hasTeam: false,
          message: 'Nenhuma rodada ativa encontrada',
          league: { id: league.id, name: league.name, entryFee: league.entryFee }
        });
      }
    }

    console.log(`🔍 [TEAM-GET] Buscando UserTeam para: userId=${userId}, competitionId=${targetCompetitionId}`);

    const userTeam = await prisma.userTeam.findUnique({
      where: {
        userId_competitionId: {
          userId: userId,
          competitionId: targetCompetitionId
        }
      }
    });

    if (!userTeam) {
      console.log('⚠️ [TEAM-GET] Time não encontrado para esta rodada.');
      return NextResponse.json({
        hasTeam: false,
        league: { id: league.id, name: league.name, entryFee: league.entryFee }
      });
    }

    // Parse tokens
    const teamTokens = userTeam.players as string[];

    // Buscar dados de mercado (com dedupe)
    const marketData = await getMarketDataWithFallback(teamTokens);
    let tokenDetails = mapMarketDataToResponse(marketData, teamTokens);

    // ✅ NOVO: Se for uma rodada específica, tentar buscar pontuação histórica (CompetitionToken)
    if (targetCompetitionId) {
      const competitionTokens = await prisma.competitionToken.findMany({
        where: {
          competitionId: targetCompetitionId,
          symbol: { in: teamTokens }
        }
      });

      if (competitionTokens.length > 0) {
        console.log(`✅ [TEAM-GET] Encontrados ${competitionTokens.length} tokens históricos para pontuação`);
        
        tokenDetails = tokenDetails.map(token => {
          const histToken = competitionTokens.find(ct => ct.symbol === token.symbol);
          if (histToken && histToken.percentChange !== null) {
            // Substituir variação/pontuação pelos dados históricos
            return {
              ...token,
              // Usar percentChange histórico como "score" e "priceChange7d" para exibição correta
              priceChange7d: Number(histToken.percentChange),
              priceChange24h: 0, // Zerar para não confundir
              currentPrice: Number(histToken.priceEnd || histToken.priceStart || token.currentPrice),
              isHistorical: true // Flag para o frontend saber
            };
          }
          return token;
        });
      }
    }

    console.log(`✅ [TEAM-GET] Time encontrado: ${userTeam.id}`);

    // Calcular ranking da rodada
    const allTeamsInCompetition = await prisma.userTeam.findMany({
      where: { competitionId: targetCompetitionId },
      select: {
        userId: true,
        totalPoints: true
      },
      orderBy: { totalPoints: 'desc' }
    });

    const userRank = allTeamsInCompetition.findIndex(t => t.userId === userId) + 1;

    return NextResponse.json({
      hasTeam: true,
      team: {
        id: userTeam.id,
        name: userTeam.teamName,
        tokens: teamTokens,
        competitionId: userTeam.competitionId,
        totalPoints: Number(userTeam.totalPoints) || 0,
        rank: userRank > 0 ? userRank : null,
        hasValidEntry: true,
        updatedAt: userTeam.updatedAt
      },
      tokenDetails,
      league: { id: league.id, name: league.name, entryFee: league.entryFee }
    });

  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
