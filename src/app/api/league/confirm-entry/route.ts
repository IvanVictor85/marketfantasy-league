import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Connection, PublicKey } from '@solana/web3.js'

const confirmEntrySchema = z.object({
  userWallet: z.string().min(32, 'Invalid wallet address'),
  transactionHash: z.string().min(64, 'Invalid transaction hash'),
  leagueId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userWallet, transactionHash, leagueId } = confirmEntrySchema.parse(body)

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
    const existingEntry = await prisma.leagueEntry.findUnique({
      where: {
        leagueId_userWallet: {
          leagueId: league.id,
          userWallet: userWallet
        }
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

    // Allow for small transaction fee differences
    const tolerance = 0.001 * 1_000_000_000 // 0.001 SOL tolerance for fees
    if (Math.abs(amountTransferred - entryFeeInLamports) > tolerance) {
      return NextResponse.json(
        { 
          error: 'Valor da transação não corresponde à taxa de entrada',
          expected: league.entryFee,
          actual: amountTransferred / 1_000_000_000
        },
        { status: 400 }
      )
    }

    // Create or update entry record
    const entryData = {
      leagueId: league.id,
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
          leagueId_userWallet: {
            leagueId: league.id,
            userWallet: userWallet
          }
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
        userWallet: userWallet,
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
    console.error('Error confirming league entry:', error)
    
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