import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Connection, PublicKey } from '@solana/web3.js'

const checkEntrySchema = z.object({
  userWallet: z.string().min(32, 'Invalid wallet address'),
  leagueId: z.string().optional()
})

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json()
    const { userWallet, leagueId } = checkEntrySchema.parse(body)
    
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
    const existingEntry = await prisma.leagueEntry.findUnique({
      where: {
        leagueId_userWallet: {
          leagueId: league.id,
          userWallet: userWallet
        }
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