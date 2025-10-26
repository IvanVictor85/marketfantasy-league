import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Connection, PublicKey } from '@solana/web3.js'

const checkEntrySchema = z.object({
  leagueId: z.string().optional()
})

// Função para obter o usuário autenticado
async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    console.log('🔑 [CHECK-ENTRY] Token recebido:', token ? 'Presente' : 'Ausente');
    console.log('🔑 [CHECK-ENTRY] Headers Authorization:', request.headers.get('Authorization'));
    console.log('🔑 [CHECK-ENTRY] Cookie auth-token:', request.cookies.get('auth-token')?.value);

    if (!token) {
      console.log('❌ [CHECK-ENTRY] Nenhum token encontrado');
      return null;
    }

    const authToken = await prisma.authToken.findUnique({
      where: { token },
      include: { user: true }
    });

    console.log('🔍 [CHECK-ENTRY] AuthToken encontrado:', authToken ? 'SIM' : 'NÃO');
    if (authToken) {
      console.log('🔍 [CHECK-ENTRY] Token expira em:', authToken.expiresAt);
      console.log('🔍 [CHECK-ENTRY] Token expirado:', authToken.expiresAt < new Date());
    }

    if (!authToken || authToken.expiresAt < new Date()) {
      console.log('❌ [CHECK-ENTRY] Token inválido ou expirado');
      return null;
    }

    console.log('✅ [CHECK-ENTRY] Usuário autenticado:', authToken.userId);
    return authToken.userId;
  } catch (error) {
    console.error('❌ [AUTH] Erro ao obter usuário:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Ler o body primeiro
    const body = await request.json()
    const { leagueId } = checkEntrySchema.parse(body)

    // 🔒 SEGURANÇA: Obter userId do usuário autenticado
    const userId = await getUserFromRequest(request);

    if (!userId) {
      console.error('❌ [CHECK-ENTRY] Usuário não autenticado');
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

    if (!user) {
      console.error('❌ [CHECK-ENTRY] Usuário não encontrado');
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // 🔓 PERMITIR ACESSO SEM CARTEIRA: Retornar estado indicando necessidade de carteira
    if (!user.publicKey) {
      console.log('⚠️ [CHECK-ENTRY] Usuário sem carteira vinculada - retornando estado sem entrada');

      // Buscar informações da liga para retornar ao cliente
      let league;
      if (leagueId) {
        league = await prisma.league.findUnique({
          where: { id: leagueId }
        });
      } else {
        league = await prisma.league.findFirst({
          where: {
            leagueType: 'MAIN',
            isActive: true
          }
        });
      }

      return NextResponse.json({
        hasPaid: false,
        needsWallet: true,
        message: 'Conecte uma carteira para entrar na liga',
        league: league ? {
          id: league.id,
          name: league.name,
          entryFee: league.entryFee,
          totalPrizePool: league.totalPrizePool,
          participantCount: league.participantCount,
          isActive: league.isActive
        } : null
      });
    }

    const userWallet = user.publicKey; // 🔒 SEGURANÇA: Usando carteira do banco, não do cliente!
    
    console.log('🔍 API check-entry: Verificando entrada para:', userWallet, 'Liga:', leagueId || 'MAIN');

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

    // Check if user has a valid entry in the database
    const existingEntry = await prisma.leagueEntry.findFirst({
      where: {
        userId: userId,
        leagueId: league.id,
        status: 'CONFIRMED'
      }
    })

    // If entry exists and is confirmed, user has paid
    if (existingEntry && existingEntry.status === 'CONFIRMED') {
      const dbTime = Date.now() - startTime;
      console.log('✅ API check-entry: Entrada encontrada no DB em', dbTime, 'ms');
      return NextResponse.json({
        hasPaid: true,
        entry: {
          transactionHash: existingEntry.transactionHash,
          amountPaid: existingEntry.amountPaid,
          createdAt: existingEntry.createdAt
        },
        league: {
          id: league.id,
          name: league.name,
          entryFee: league.entryFee,
          totalPrizePool: league.totalPrizePool,
          participantCount: league.participantCount
        }
      })
    }

    // If no entry found in specific league and it's not the Main League, 
    // check if user has paid for Main League (which gives access to all leagues)
    if (leagueId && league.leagueType !== 'MAIN') {
      console.log('🔍 API check-entry: Verificando entrada na Liga Principal como fallback...');
      
      const mainLeague = await prisma.league.findFirst({
        where: { 
          leagueType: 'MAIN',
          isActive: true 
        }
      })

      if (mainLeague) {
        const mainLeagueEntry = await prisma.leagueEntry.findFirst({
          where: {
            userId: userId,
            leagueId: mainLeague.id,
            status: 'CONFIRMED'
          }
        })

        if (mainLeagueEntry && mainLeagueEntry.status === 'CONFIRMED') {
          const dbTime = Date.now() - startTime;
          console.log('✅ API check-entry: Entrada na Liga Principal encontrada (acesso liberado) em', dbTime, 'ms');
          return NextResponse.json({
            hasPaid: true,
            entry: {
              transactionHash: mainLeagueEntry.transactionHash,
              amountPaid: mainLeagueEntry.amountPaid,
              createdAt: mainLeagueEntry.createdAt
            },
            league: {
              id: league.id,
              name: league.name,
              entryFee: league.entryFee,
              totalPrizePool: league.totalPrizePool,
              participantCount: league.participantCount
            },
            accessViaMainLeague: true
          })
        }
      }
    }

    // Skip on-chain verification for performance
    // On-chain verification should only be done during payment confirmation
    console.log('⚡ API check-entry: Entrada não encontrada no DB, retornando false (sem verificação on-chain)');

    const totalTime = Date.now() - startTime;
    console.log('❌ API check-entry: Entrada não encontrada. Tempo total:', totalTime, 'ms');
    return NextResponse.json({
      hasPaid: false,
      league: {
        id: league.id,
        name: league.name,
        entryFee: league.entryFee,
        totalPrizePool: league.totalPrizePool,
        participantCount: league.participantCount
      }
    })

  } catch (error) {
    console.error('Error checking league entry:', error)
    
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