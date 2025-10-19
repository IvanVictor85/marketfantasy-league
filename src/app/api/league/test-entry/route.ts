import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const testEntrySchema = z.object({
  userWallet: z.string().min(32, 'Invalid wallet address'),
  leagueId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userWallet, leagueId } = testEntrySchema.parse(body)

    console.log('🧪 [TEST-ENTRY] Criando entrada de teste para:', userWallet)

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

    // Create test entry (bypass on-chain verification)
    const entryData = {
      leagueId: league.id,
      userWallet: userWallet,
      transactionHash: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amountPaid: league.entryFee,
      status: 'CONFIRMED' as const,
      blockHeight: 123456789 // Test block height
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

    console.log('✅ [TEST-ENTRY] Entrada de teste criada com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Entrada de teste confirmada com sucesso',
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
    console.error('Error creating test entry:', error)
    
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
