import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Inicializando Liga Principal...')

    // Verificar se a Liga Principal já existe
    const existingLeague = await prisma.league.findFirst({
      where: { leagueType: 'MAIN' }
    })

    if (existingLeague) {
      console.log('✅ Liga Principal já existe:', existingLeague.name)
      return NextResponse.json({
        success: true,
        message: 'Liga Principal já existe',
        league: existingLeague
      })
    }

    // Criar a Liga Principal
    const mainLeague = await prisma.league.create({
      data: {
        name: 'Liga Principal',
        leagueType: 'MAIN',
        entryFee: 0.005, // 0.005 SOL
        maxPlayers: null, // Unlimited
        startDate: new Date(), // Starts immediately
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
        treasuryPda: 'PLACEHOLDER_PDA',
        programId: null,
        adminWallet: 'PLACEHOLDER_ADMIN',
        protocolWallet: 'PLACEHOLDER_PROTOCOL',
        emblemUrl: '/league-logos/main-league.svg',
        description: 'Liga Principal do Market Fantasy League - Competição mensal de tokens',
        status: 'ACTIVE',
        badgeUrl: '/league-logos/main-league-badge.svg',
        bannerUrl: '/league-logos/main-league-banner.svg',
        prizeDistribution: JSON.stringify({
          first: 50,
          second: 30,
          third: 20
        }),
        totalPrizePool: 0,
        participantCount: 0
      }
    })

    console.log('✅ Liga Principal criada com sucesso!')
    console.log('📊 Detalhes:', {
      id: mainLeague.id,
      name: mainLeague.name,
      entryFee: `${mainLeague.entryFee} SOL`,
      startDate: mainLeague.startDate.toISOString(),
      endDate: mainLeague.endDate.toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Liga Principal criada com sucesso',
      league: {
        id: mainLeague.id,
        name: mainLeague.name,
        entryFee: `${mainLeague.entryFee} SOL`,
        startDate: mainLeague.startDate.toISOString(),
        endDate: mainLeague.endDate.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Erro ao inicializar Liga Principal:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao inicializar Liga Principal',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}