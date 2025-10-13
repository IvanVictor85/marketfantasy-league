import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userWallet } = await request.json()

    if (!userWallet) {
      return NextResponse.json(
        { error: 'userWallet é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar a liga principal
    const mainLeague = await prisma.league.findFirst({
      where: { 
        leagueType: 'MAIN',
        isActive: true 
      }
    })

    if (!mainLeague) {
      return NextResponse.json(
        { error: 'Liga principal não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já existe entrada para este usuário
    const existingEntry = await prisma.leagueEntry.findUnique({
      where: {
        leagueId_userWallet: {
          leagueId: mainLeague.id,
          userWallet: userWallet
        }
      }
    })

    if (existingEntry) {
      return NextResponse.json({
        success: true,
        message: 'Entrada já existe para este usuário',
        entry: existingEntry
      })
    }

    // Criar entrada de pagamento simulada
    const leagueEntry = await prisma.leagueEntry.create({
      data: {
        leagueId: mainLeague.id,
        userWallet: userWallet,
        transactionHash: `test_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amountPaid: mainLeague.entryFee,
        status: 'CONFIRMED',
        blockHeight: Math.floor(Math.random() * 1000000)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Entrada de pagamento criada com sucesso',
      entry: leagueEntry,
      league: {
        id: mainLeague.id,
        name: mainLeague.name,
        entryFee: mainLeague.entryFee
      }
    })

  } catch (error) {
    console.error('Erro ao criar entrada de pagamento:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}