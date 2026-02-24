import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/wallet/check?publicKey=XXX
 *
 * Verifica se uma carteira já está vinculada a alguma conta
 * Usado ANTES de tentar conectar para evitar processo desnecessário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicKey = searchParams.get('publicKey');

    if (!publicKey) {
      return NextResponse.json(
        { error: 'PublicKey é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar se a carteira já está vinculada
    const existingUser = await prisma.user.findUnique({
      where: { publicKey },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      }
    });

    if (existingUser) {
      return NextResponse.json({
        available: false,
        message: 'Esta carteira já está vinculada a outra conta',
        accountName: existingUser.name || existingUser.username || 'Conta existente',
        // Não retornar email completo por segurança
        accountHint: existingUser.email 
          ? `${existingUser.email.substring(0, 3)}***@${existingUser.email.split('@')[1]}`
          : null
      });
    }

    return NextResponse.json({
      available: true,
      message: 'Carteira disponível para vinculação'
    });

  } catch (error) {
    console.error('❌ [WALLET-CHECK] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar carteira' },
      { status: 500 }
    );
  }
}
