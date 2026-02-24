import { NextRequest, NextResponse } from 'next/server';
import { ensureReferralCode, applyReferralCode } from '@/lib/referral-service';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/referral/code
 *
 * Retorna o código de referral do usuário logado
 * Gera um novo código se não existir
 */
export async function GET(request: NextRequest) {
  try {
    // Buscar token de autenticação
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Buscar usuário pelo token
    const tokenRecord = await prisma.authToken.findUnique({
      where: { token: authToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const userId = tokenRecord.user.id;

    // Garante que tem código de referral
    const referralCode = await ensureReferralCode(userId);

    // Gera link completo
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mfl.gg';
    const referralLink = `${baseUrl}/ref/${referralCode}`;

    return NextResponse.json({
      success: true,
      code: referralCode,
      link: referralLink,
    });
  } catch (error) {
    console.error('❌ [REFERRAL/CODE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar código de referral' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referral/code
 *
 * Aplica um código de referral ao usuário logado
 * Body:
 * - code: string (código de referral)
 */
export async function POST(request: NextRequest) {
  try {
    // Buscar token de autenticação
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Buscar usuário pelo token
    const tokenRecord = await prisma.authToken.findUnique({
      where: { token: authToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const userId = tokenRecord.user.id;

    // Verifica se já foi indicado por alguém
    if (tokenRecord.user.referredById) {
      return NextResponse.json(
        { error: 'Você já foi indicado por outro usuário' },
        { status: 400 }
      );
    }

    // Parse body
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Código de referral inválido' },
        { status: 400 }
      );
    }

    // Aplica o código
    const result = await applyReferralCode(userId, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Código aplicado com sucesso! Seu amigo ganhou pontos.',
    });
  } catch (error) {
    console.error('❌ [REFERRAL/CODE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao aplicar código de referral' },
      { status: 500 }
    );
  }
}
