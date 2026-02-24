import { NextRequest, NextResponse } from 'next/server';
import { getReferralStats, ensureReferralCode } from '@/lib/referral-service';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/referral/stats
 *
 * Retorna estatísticas de referral do usuário logado
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

    // Garante que o usuário tem um código de referral
    await ensureReferralCode(userId);

    // Busca estatísticas
    const stats = await getReferralStats(userId);

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    console.error('❌ [REFERRAL/STATS] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas de referral' },
      { status: 500 }
    );
  }
}
