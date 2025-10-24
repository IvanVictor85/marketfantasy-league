import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const testEntrySchema = z.object({
  leagueId: z.string().optional()
})

async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Try to get from Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const authToken = await prisma.authToken.findUnique({
        where: { token },
        include: { user: true }
      });
      
      if (authToken && authToken.expiresAt > new Date()) {
        return authToken.userId;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leagueId } = testEntrySchema.parse(body)

    // Get userId from authentication
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    console.log('🧪 [TEST-ENTRY] Criando entrada de teste para userId:', userId)

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
        leagueId: league.id
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

    // Get user's wallet address from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { publicKey: true }
    });

    if (!user || !user.publicKey) {
      return NextResponse.json(
        { error: 'Usuário sem carteira vinculada' },
        { status: 400 }
      );
    }

    // Create test entry (bypass on-chain verification)
    const entryData = {
      leagueId: league.id,
      userId: userId,
      userWallet: user.publicKey,
      transactionHash: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amountPaid: league.entryFee,
      status: 'CONFIRMED' as const,
      blockHeight: 123456789 // Test block height
    }

    let entry
    if (existingEntry) {
      entry = await prisma.leagueEntry.update({
        where: { id: existingEntry.id },
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
