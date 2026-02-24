import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/referral/validate?code=XXX
 *
 * Valida um código de referral e retorna informações do referenciador
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Código não fornecido' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo código de referral
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code.toUpperCase() },
      select: {
        id: true,
        name: true,
        username: true,
        publicKey: true,
      },
    });

    if (!referrer) {
      return NextResponse.json({
        valid: false,
        error: 'Código de referral inválido',
      });
    }

    // Retornar informações básicas (sem expor dados sensíveis)
    return NextResponse.json({
      valid: true,
      referrerId: referrer.id,
      referrerName: referrer.name || referrer.username || 'Um amigo',
      referrerWallet: referrer.publicKey
        ? `${referrer.publicKey.slice(0, 4)}...${referrer.publicKey.slice(-4)}`
        : null,
    });
  } catch (error) {
    console.error('❌ [REFERRAL/VALIDATE] Erro:', error);
    return NextResponse.json(
      { valid: false, error: 'Erro ao validar código' },
      { status: 500 }
    );
  }
}
