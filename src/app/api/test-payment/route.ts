import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      console.error('❌ [TEST-PAYMENT] Usuário não autenticado');
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
      console.error('❌ [TEST-PAYMENT] Usuário sem carteira vinculada');
      return NextResponse.json(
        { error: 'Você precisa conectar uma carteira antes de testar pagamento' },
        { status: 400 }
      );
    }

    const userWallet = user.publicKey; // 🔒 SEGURANÇA: Usando carteira do banco, não do cliente!

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
    const existingEntry = await prisma.leagueEntry.findFirst({
      where: {
        userId: userId,
        leagueId: mainLeague.id,
        status: 'CONFIRMED'
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
        userId: userId,
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