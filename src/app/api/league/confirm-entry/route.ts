import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Connection, PublicKey } from '@solana/web3.js'

const confirmEntrySchema = z.object({
  userWallet: z.string().min(32, 'Invalid wallet address'),
  transactionHash: z.string().min(64, 'Invalid transaction hash'),
  leagueId: z.string().optional()
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
  try {
    // 🔒 SEGURANÇA: Obter userId do usuário autenticado
    const userId = await getUserFromRequest(request);

    if (!userId) {
      console.error('❌ [CONFIRM-ENTRY] Usuário não autenticado');
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
      console.error('❌ [CONFIRM-ENTRY] Usuário sem carteira vinculada');
      return NextResponse.json(
        { error: 'Você precisa conectar uma carteira antes de confirmar entrada' },
        { status: 400 }
      );
    }

    const userWallet = user.publicKey; // 🔒 SEGURANÇA: Usando carteira do banco, não do cliente!

    const body = await request.json()
    console.log('🔍 [CONFIRM-ENTRY] Request body:', body)
    
    const { transactionHash, leagueId } = confirmEntrySchema.parse(body)
    console.log('🔍 [CONFIRM-ENTRY] Parsed data:', { userWallet, transactionHash, leagueId })

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

    // Check if entry already exists
    const existingEntry = await prisma.leagueEntry.findFirst({
      where: {
        userId: userId,
        leagueId: league.id,
        status: 'CONFIRMED'
      }
    })

    if (existingEntry && existingEntry.status === 'CONFIRMED') {
      return NextResponse.json({
        success: true,
        message: 'Entrada já confirmada',
        entry: {
          transactionHash: existingEntry.transactionHash,
          amountPaid: existingEntry.amountPaid,
          createdAt: existingEntry.createdAt
        }
      })
    }

    // Verify transaction on-chain
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    )

    let transaction
    try {
      transaction = await connection.getTransaction(transactionHash, {
        maxSupportedTransactionVersion: 0
      })
    } catch (error) {
      console.error('Error fetching transaction:', error)
      return NextResponse.json(
        { error: 'Transação não encontrada na blockchain' },
        { status: 404 }
      )
    }

    if (!transaction || !transaction.meta) {
      return NextResponse.json(
        { error: 'Transação inválida ou não confirmada' },
        { status: 400 }
      )
    }

    // Verify transaction details
    const entryFeeInLamports = league.entryFee * 1_000_000_000 // Convert SOL to lamports
    const userPublicKey = new PublicKey(userWallet)

    // Check if the transaction involves the user's wallet
    const accountKeys = transaction.transaction.message.getAccountKeys()
    const accountKeysArray = Array.from(accountKeys.keySegments()).flat()
    const userAccountIndex = accountKeysArray.findIndex((key: PublicKey) => key.equals(userPublicKey))

    if (userAccountIndex === -1) {
      return NextResponse.json(
        { error: 'Transação não pertence à carteira informada' },
        { status: 400 }
      )
    }

    // Verify the amount transferred
    const preBalance = transaction.meta.preBalances[userAccountIndex]
    const postBalance = transaction.meta.postBalances[userAccountIndex]
    const amountTransferred = preBalance - postBalance

    console.log('🔍 [CONFIRM-ENTRY] Debug valores:')
    console.log('   Entry Fee (SOL):', league.entryFee)
    console.log('   Entry Fee (lamports):', entryFeeInLamports)
    console.log('   Pre Balance:', preBalance)
    console.log('   Post Balance:', postBalance)
    console.log('   Amount Transferred (lamports):', amountTransferred)
    console.log('   Amount Transferred (SOL):', amountTransferred / 1_000_000_000)

    // Allow for small transaction fee differences
    const tolerance = 0.001 * 1_000_000_000 // 0.001 SOL tolerance for fees
    const difference = Math.abs(amountTransferred - entryFeeInLamports)
    console.log('   Difference (lamports):', difference)
    console.log('   Tolerance (lamports):', tolerance)
    console.log('   Within tolerance:', difference <= tolerance)

    if (difference > tolerance) {
      return NextResponse.json(
        { 
          error: 'Valor da transação não corresponde à taxa de entrada',
          expected: league.entryFee,
          actual: amountTransferred / 1_000_000_000,
          difference: difference / 1_000_000_000,
          tolerance: tolerance / 1_000_000_000
        },
        { status: 400 }
      )
    }

    // Create or update entry record
    const entryData = {
      leagueId: league.id,
      userId: userId,
      userWallet: userWallet,
      transactionHash: transactionHash,
      amountPaid: league.entryFee,
      status: 'CONFIRMED' as const,
      blockHeight: Number(transaction.slot)
    }

    let entry
    if (existingEntry) {
      entry = await prisma.leagueEntry.update({
        where: {
          id: existingEntry.id
        },
        data: entryData
      })
    } else {
      entry = await prisma.leagueEntry.create({
        data: entryData
      })

      // Update league participant count and prize pool
      await prisma.league.update({
        where: { id: league.id },
        data: {
          participantCount: { increment: 1 },
          totalPrizePool: { increment: league.entryFee }
        }
      })
    }

    // Update user's team to mark as having valid entry
    await prisma.team.updateMany({
      where: {
        userId: userId,
        leagueId: league.id
      },
      data: {
        hasValidEntry: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Entrada confirmada com sucesso',
      entry: {
        transactionHash: entry.transactionHash,
        amountPaid: entry.amountPaid,
        createdAt: entry.createdAt
      },
      league: {
        id: league.id,
        name: league.name,
        entryFee: league.entryFee,
        totalPrizePool: league.totalPrizePool,
        participantCount: league.participantCount
      }
    })

  } catch (error) {
    console.error('❌ [CONFIRM-ENTRY] Error confirming league entry:', error)
    
    if (error instanceof z.ZodError) {
      console.error('❌ [CONFIRM-ENTRY] Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('❌ [CONFIRM-ENTRY] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}