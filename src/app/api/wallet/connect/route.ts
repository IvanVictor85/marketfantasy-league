import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ConnectWalletRequest {
  userId?: string;
  email?: string;
  publicKey: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, email, publicKey }: ConnectWalletRequest = await request.json();

    console.log('🔗 [CONNECT] Tentando conectar carteira:', {
      userId,
      email,
      publicKey: publicKey?.substring(0, 10) + '...'
    });

    if (!publicKey) {
      return NextResponse.json(
        { error: 'PublicKey é obrigatório' },
        { status: 400 }
      );
    }

    let user;

    // 1. Buscar usuário por userId ou email
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email }
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ [CONNECT] Usuário encontrado:', user.email);

    // 2. VERIFICAR SE CARTEIRA JÁ ESTÁ EM USO POR OUTRO USUÁRIO
    const existingWallet = await prisma.user.findFirst({
      where: {
        publicKey: publicKey,
        id: { not: user.id } // Diferente do usuário atual
      }
    });

    if (existingWallet) {
      console.error('❌ [CONNECT] Carteira já em uso por outro usuário:', {
        existingUser: existingWallet.email,
        currentUser: user.email
      });

      return NextResponse.json(
        {
          error: 'Esta carteira já está conectada a outra conta',
          details: `Carteira em uso por ${existingWallet.email.substring(0, 3)}***`,
          suggestion: 'Use uma carteira diferente ou faça login com a conta original'
        },
        { status: 409 } // Conflict
      );
    }

    // 3. SE USUÁRIO JÁ TEM CARTEIRA DIFERENTE, AVISAR
    if (user.publicKey && user.publicKey !== publicKey) {
      console.warn('⚠️ [CONNECT] Usuário trocando carteira:', {
        email: user.email,
        carteira_antiga: user.publicKey?.substring(0, 10) + '...',
        carteira_nova: publicKey?.substring(0, 10) + '...'
      });

      // Permitir troca mas registrar no log
    }

    // 4. ATUALIZAR CARTEIRA DO USUÁRIO
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { publicKey }
    });

    console.log('✅ [CONNECT] Carteira conectada com sucesso:', {
      userId: updated.id,
      email: updated.email,
      publicKey: updated.publicKey?.substring(0, 10) + '...'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        publicKey: updated.publicKey,
        avatar: updated.avatar,
        twitter: updated.twitter,
        discord: updated.discord,
        bio: updated.bio
      },
      message: 'Carteira conectada com sucesso'
    });

  } catch (error) {
    console.error('❌ [CONNECT] Erro:', error);

    // Se for erro de constraint unique do Prisma
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'Esta carteira já está em uso',
          details: 'A carteira Solana fornecida já está conectada a outra conta'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao conectar carteira' },
      { status: 500 }
    );
  }
}

// Handler para GET - verificar se carteira está disponível
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

    const existingUser = await prisma.user.findFirst({
      where: { publicKey }
    });

    return NextResponse.json({
      available: !existingUser,
      inUse: !!existingUser,
      user: existingUser ? {
        email: existingUser.email.substring(0, 3) + '***',
        name: existingUser.name
      } : null
    });

  } catch (error) {
    console.error('❌ [CHECK-WALLET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar carteira' },
      { status: 500 }
    );
  }
}
