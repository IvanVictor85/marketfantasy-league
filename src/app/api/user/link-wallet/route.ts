import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      console.error('❌ [LINK-WALLET] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { publicKey } = body;

    if (!publicKey || typeof publicKey !== 'string') {
      console.error('❌ [LINK-WALLET] PublicKey inválido');
      return NextResponse.json(
        { error: 'PublicKey inválido ou não fornecido' },
        { status: 400 }
      );
    }

    console.log('🔗 [LINK-WALLET] Vinculando carteira:', { userId, publicKey });

    // Verificar se a carteira já está em uso por outro usuário
    const existingWallet = await prisma.user.findFirst({
      where: {
        publicKey: publicKey,
        id: { not: userId } // Não é o usuário atual
      }
    });

    if (existingWallet) {
      console.error('❌ [LINK-WALLET] Carteira já em uso por outro usuário');
      return NextResponse.json(
        { error: 'Esta carteira já está conectada a outra conta' },
        { status: 409 }
      );
    }

    // Atualizar o usuário com a nova carteira
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { publicKey: publicKey }
    });

    console.log('✅ [LINK-WALLET] Carteira vinculada com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Carteira vinculada com sucesso',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        publicKey: updatedUser.publicKey
      }
    });

  } catch (error) {
    console.error('❌ [LINK-WALLET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao vincular carteira' },
      { status: 500 }
    );
  }
}
