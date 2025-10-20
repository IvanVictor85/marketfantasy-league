import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validateTokens } from '@/lib/valid-tokens'

// 🔒 SEGURANÇA: Schema NÃO aceita mais userWallet do cliente
const teamSchema = z.object({
  leagueId: z.string().optional(),
  teamName: z.string().min(1, 'Team name is required').max(50, 'Team name too long'),
  tokens: z.array(z.string()).length(10, 'Team must have exactly 10 tokens')
})

// Função para obter o usuário autenticado
async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const authToken = await prisma.authToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!authToken || authToken.expiresAt < new Date()) {
      return null;
    }

    return authToken.userId;
  } catch (error) {
    console.error('❌ [AUTH] Erro ao obter usuário:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 API team POST: Iniciando salvamento de time...');
  try {
    // 🔒 SEGURANÇA: Obter userId do usuário autenticado
    const userId = await getUserFromRequest(request);

    if (!userId) {
      console.error('❌ [TEAM] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // 🔒 SEGURANÇA: Buscar a carteira do usuário no banco (fonte confiável)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { publicKey: true, email: true }
    });

    if (!user || !user.publicKey) {
      console.error('❌ [TEAM] Usuário sem carteira vinculada');
      return NextResponse.json(
        { error: 'Você precisa conectar uma carteira antes de criar um time' },
        { status: 400 }
      );
    }

    const userWallet = user.publicKey; // 🔒 SEGURANÇA: Usando carteira do banco, não do cliente!

    const body = await request.json()
    console.log('📥 API team POST: Body recebido:', body);
    const { leagueId, teamName, tokens } = teamSchema.parse(body)
    console.log('✅ API team POST: Dados validados:', { userId, userWallet, leagueId, teamName, tokensLength: tokens.length });

    // Validar exatamente 10 tokens
    if (tokens.length !== 10) {
      console.log('❌ API team POST: Quantidade inválida de tokens:', tokens.length);
      return NextResponse.json(
        {
          error: `Time deve ter exatamente 10 tokens. Você forneceu ${tokens.length}.`,
          requiresPayment: false
        },
        { status: 400 }
      )
    }

    // Validar que não há duplicatas
    const uniqueTokens = new Set(tokens);
    if (uniqueTokens.size !== 10) {
      console.log('❌ API team POST: Tokens duplicados detectados');
      const duplicates = tokens.filter((token, index) => tokens.indexOf(token) !== index);
      return NextResponse.json(
        {
          error: 'Não pode haver tokens duplicados no time',
          duplicates: [...new Set(duplicates)],
          requiresPayment: false
        },
        { status: 400 }
      )
    }

    // Get Main League if no specific league ID provided
    console.log('🔍 API team POST: Buscando liga...', leagueId ? `ID: ${leagueId}` : 'Liga principal');
    let league
    if (leagueId) {
      league = await prisma.league.findUnique({
        where: { id: leagueId }
      })
    } else {
      league = await prisma.league.findFirst({
        where: { 
          leagueType: 'MAIN',
          isActive: true 
        }
      })
    }

    if (!league) {
      console.log('❌ API team POST: Liga não encontrada');
      return NextResponse.json(
        { error: 'Liga não encontrada' },
        { status: 404 }
      )
    }
    console.log('✅ API team POST: Liga encontrada:', { id: league.id, name: league.name });

    // Check if user has paid entry fee
    console.log('💰 API team POST: Verificando entrada na liga...');
    const leagueEntry = await prisma.leagueEntry.findUnique({
      where: {
        leagueId_userWallet: {
          leagueId: league.id,
          userWallet: userWallet
        }
      }
    })

    if (!leagueEntry || leagueEntry.status !== 'CONFIRMED') {
      console.log('❌ API team POST: Entrada não confirmada:', leagueEntry ? leagueEntry.status : 'não encontrada');
      return NextResponse.json(
        { 
          error: 'Pagamento da taxa de entrada não confirmado',
          requiresPayment: true,
          league: {
            id: league.id,
            name: league.name,
            entryFee: league.entryFee
          }
        },
        { status: 402 } // Payment Required
      )
    }
    console.log('✅ API team POST: Entrada confirmada');

    // Validate tokens against known valid symbols
    console.log('🔍 API team POST: Validando tokens...', tokens);
    const tokenValidation = validateTokens(tokens);
    
    if (!tokenValidation.valid) {
      console.log('❌ API team POST: Tokens inválidos:', tokenValidation.invalidTokens);
      return NextResponse.json(
        { 
          error: 'Tokens inválidos encontrados',
          invalidTokens: tokenValidation.invalidTokens
        },
        { status: 400 }
      )
    }
    console.log('✅ API team POST: Tokens validados');

    // Get token details from database if they exist, otherwise use symbol as name
    const dbTokens = await prisma.token.findMany({
      where: {
        symbol: {
          in: tokens
        }
      },
      select: {
        symbol: true,
        name: true
      }
    })

    const validTokens = tokens.map(symbol => {
      const dbToken = dbTokens.find((t: { symbol: string; name: string }) => t.symbol === symbol);
      return {
        symbol,
        name: dbToken?.name || symbol
      };
    });

    // Check if team already exists for this user and league
    console.log('🔍 API team POST: Verificando time existente...');
    const existingTeam = await prisma.team.findUnique({
      where: {
        leagueId_userWallet: {
          leagueId: league.id,
          userWallet: userWallet
        }
      }
    })

    let team
    if (existingTeam) {
      // Update existing team
      console.log('🔄 API team POST: Atualizando time existente:', existingTeam.id);
      team = await prisma.team.update({
        where: {
          leagueId_userWallet: {
            leagueId: league.id,
            userWallet: userWallet
          }
        },
        data: {
          teamName: teamName,
          tokens: JSON.stringify(tokens),
          hasValidEntry: true,
          updatedAt: new Date()
        }
      })
      console.log('✅ API team POST: Time atualizado com sucesso');
    } else {
      // Create new team
      console.log('➕ API team POST: Criando novo time...');
      team = await prisma.team.create({
        data: {
          userWallet: userWallet,
          leagueId: league.id,
          teamName: teamName,
          tokens: JSON.stringify(tokens),
          hasValidEntry: true
        }
      })
      console.log('✅ API team POST: Novo time criado com sucesso:', team.id);
    }

    // Calculate initial team value (placeholder - would need price data)
    const teamValue = 0; // TODO: Calculate based on actual token prices

    // Get the updated team data
    const updatedTeam = team;

    return NextResponse.json({
      success: true,
      message: existingTeam ? 'Time atualizado com sucesso' : 'Time criado com sucesso',
      team: {
        id: updatedTeam.id,
        name: updatedTeam.teamName,
        tokens: JSON.parse(updatedTeam.tokens),
        totalValue: teamValue,
        performance: updatedTeam.totalScore || 0,
        hasValidEntry: updatedTeam.hasValidEntry,
        createdAt: updatedTeam.createdAt,
        updatedAt: updatedTeam.updatedAt
      },
      tokenDetails: validTokens
    })

  } catch (error) {
    console.error('Error managing team:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userWallet = searchParams.get('userWallet')
    const leagueId = searchParams.get('leagueId')

    if (!userWallet) {
      return NextResponse.json(
        { error: 'Wallet do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Get Main League if no specific league ID provided
    let league
    if (leagueId) {
      league = await prisma.league.findUnique({
        where: { id: leagueId }
      })
    } else {
      league = await prisma.league.findFirst({
        where: { 
          leagueType: 'MAIN',
          isActive: true 
        }
      })
    }

    if (!league) {
      return NextResponse.json(
        { error: 'Liga não encontrada' },
        { status: 404 }
      )
    }

    // Get user's team for this league
    const team = await prisma.team.findUnique({
      where: {
        leagueId_userWallet: {
          leagueId: league.id,
          userWallet: userWallet
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { 
          hasTeam: false,
          league: {
            id: league.id,
            name: league.name,
            entryFee: league.entryFee
          }
        }
      )
    }

    // Parse tokens from JSON string
    let teamTokens: string[] = [];
    try {
      teamTokens = JSON.parse(team.tokens);
    } catch (error) {
      console.error('Error parsing team tokens:', error);
      teamTokens = [];
    }

    // Get token details for the team from external API
    let tokenDetails: any[] = [];
    try {
      // Buscar dados dos tokens da API CoinGecko
      const tokensResponse = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=1h,24h,7d,30d', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoFantasy/1.0'
        }
      });

      if (tokensResponse.ok) {
        const allTokens = await tokensResponse.json();
        
        // Filtrar apenas os tokens do time
        tokenDetails = teamTokens.map(symbol => {
          const tokenData = allTokens.find((token: any) => 
            token.symbol.toUpperCase() === symbol.toUpperCase()
          );
          
          if (tokenData) {
            return {
              symbol: symbol,
              name: tokenData.name,
              logoUrl: tokenData.image,
              currentPrice: tokenData.current_price,
              priceChange24h: tokenData.price_change_percentage_24h,
              priceChange7d: tokenData.price_change_percentage_7d_in_currency
            };
          }

          // Fallback se não encontrar na API
          return {
            symbol: symbol,
            name: symbol,
            logoUrl: '',
            currentPrice: 0,
            priceChange24h: 0,
            priceChange7d: 0
          };
        });
      } else {
        console.warn('Erro ao buscar dados dos tokens da API externa');
        // Fallback: criar tokenDetails básicos
        tokenDetails = teamTokens.map(symbol => ({
          symbol: symbol,
          name: symbol,
          logoUrl: '',
          currentPrice: 0,
          priceChange24h: 0,
          priceChange7d: 0
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar tokenDetails da API externa:', error);
      // Fallback: criar tokenDetails básicos
      tokenDetails = teamTokens.map(symbol => ({
        symbol: symbol,
        name: symbol,
        logoUrl: '',
        currentPrice: 0,
        priceChange24h: 0,
        priceChange7d: 0
      }));
    }

    return NextResponse.json({
      hasTeam: true,
      team: {
        id: team.id,
        name: team.teamName,
        tokens: teamTokens,
        totalValue: 0, // Calculate based on token prices if needed
        performance: team.totalScore || 0,
        hasValidEntry: team.hasValidEntry,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      },
      tokenDetails: tokenDetails,
      league: {
        id: league.id,
        name: league.name,
        entryFee: league.entryFee
      }
    })

  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}