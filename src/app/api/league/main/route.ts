import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get the Main League
    const league = await prisma.league.findFirst({
      where: { 
        leagueType: 'MAIN',
        isActive: true 
      },
      include: {
        _count: {
          select: {
            teams: true,
            leagueEntries: {
              where: {
                status: 'CONFIRMED'
              }
            }
          }
        }
      }
    })

    if (!league) {
      return NextResponse.json(
        { error: 'Liga Principal não encontrada' },
        { status: 404 }
      )
    }

    // Calculate current round dates
    const now = new Date()
    const isWithinPeriod = now >= league.startDate && now <= league.endDate
    const isActive = league.isActive && isWithinPeriod

    return NextResponse.json({
      id: league.id,
      name: league.name,
      description: league.description,
      entryFee: league.entryFee,
      totalPrizePool: league.totalPrizePool,
      participantCount: league.participantCount,
      confirmedEntries: league._count.leagueEntries,
      teamsCreated: league._count.teams,
      startDate: league.startDate,
      endDate: league.endDate,
      isActive: isActive,
      status: league.status,
      badgeUrl: league.badgeUrl,
      bannerUrl: league.bannerUrl,
      prizeDistribution: league.prizeDistribution,
      programId: league.programId,
      treasuryPda: league.treasuryPda,
      maxPlayers: league.maxPlayers,
      leagueType: league.leagueType,
      round: {
        current: Math.floor((now.getTime() - league.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
        timeRemaining: league.endDate.getTime() - now.getTime(),
        isActive: isActive
      }
    })

  } catch (error) {
    console.error('Error fetching main league:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be used to update league stats or trigger recalculations
    const body = await request.json()
    const { action } = body

    if (action === 'refresh-stats') {
      const league = await prisma.league.findFirst({
        where: { 
          leagueType: 'MAIN',
          isActive: true 
        }
      })

      if (!league) {
        return NextResponse.json(
          { error: 'Liga Principal não encontrada' },
          { status: 404 }
        )
      }

      // Recalculate participant count and prize pool from confirmed entries
      const confirmedEntries = await prisma.leagueEntry.count({
        where: {
          leagueId: league.id,
          status: 'CONFIRMED'
        }
      })

      const totalPrizePool = confirmedEntries * league.entryFee

      // Update league with correct stats
      const updatedLeague = await prisma.league.update({
        where: { id: league.id },
        data: {
          participantCount: confirmedEntries,
          totalPrizePool: totalPrizePool
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Estatísticas da liga atualizadas',
        league: {
          id: updatedLeague.id,
          participantCount: updatedLeague.participantCount,
          totalPrizePool: updatedLeague.totalPrizePool
        }
      })
    }

    return NextResponse.json(
      { error: 'Ação não reconhecida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating main league:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}