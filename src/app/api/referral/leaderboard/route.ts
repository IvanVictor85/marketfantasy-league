import { NextRequest, NextResponse } from 'next/server';
import { getReferralLeaderboard } from '@/lib/referral-service';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/referral/leaderboard
 *
 * Retorna o ranking de pontos de referral
 * Query params:
 * - limit: número de usuários (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Busca leaderboard
    const leaderboard = await getReferralLeaderboard(Math.min(limit, 100));

    // Busca posição do usuário logado (opcional)
    let userPosition = null;
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (authToken) {
      const tokenRecord = await prisma.authToken.findUnique({
        where: { token: authToken },
        include: { user: true },
      });

      if (tokenRecord && tokenRecord.expiresAt >= new Date()) {
        const userId = tokenRecord.user.id;

        // Busca pontos do usuário
        const userPoints = await prisma.referralPoint.findUnique({
          where: { userId },
        });

        if (userPoints) {
          // Conta quantos usuários têm mais pontos
          const higherRanked = await prisma.referralPoint.count({
            where: { totalPoints: { gt: userPoints.totalPoints } },
          });

          userPosition = {
            rank: higherRanked + 1,
            userId,
            name: tokenRecord.user.name,
            wallet: tokenRecord.user.publicKey
              ? `${tokenRecord.user.publicKey.slice(0, 4)}...${tokenRecord.user.publicKey.slice(-4)}`
              : null,
            totalPoints: userPoints.totalPoints,
            tier: userPoints.tier,
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      userPosition,
      totalParticipants: await prisma.referralPoint.count(),
    });
  } catch (error) {
    console.error('❌ [REFERRAL/LEADERBOARD] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar leaderboard' },
      { status: 500 }
    );
  }
}
