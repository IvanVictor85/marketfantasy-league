import { NextRequest, NextResponse } from 'next/server';
import { onSocialShare, generateTwitterShareUrl, ensureReferralCode } from '@/lib/referral-service';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * POST /api/referral/share
 *
 * Registra um compartilhamento social e retorna pontos
 * Body:
 * - platform: 'twitter' | 'discord'
 * - type: 'victory' | 'invite'
 * - amount?: number (para vitórias)
 * - roundName?: string (para vitórias)
 * - competitionId?: string
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

    // Parse body
    const body = await request.json();
    const { platform, type, amount, roundName, competitionId } = body;

    if (!platform || !['twitter', 'discord'].includes(platform)) {
      return NextResponse.json(
        { error: 'Plataforma inválida' },
        { status: 400 }
      );
    }

    // Garante que tem código de referral
    const referralCode = await ensureReferralCode(userId);

    // Registra o compartilhamento
    const result = await onSocialShare(userId, platform, {
      competitionId,
    });

    // Gera URL de compartilhamento
    let shareUrl: string | null = null;
    if (platform === 'twitter') {
      shareUrl = generateTwitterShareUrl({
        type: type || 'invite',
        referralCode,
        amount,
        roundName,
      });
    }

    if (result.alreadyShared) {
      return NextResponse.json({
        success: true,
        alreadyShared: true,
        message: 'Você já compartilhou hoje. Volte amanhã para ganhar mais pontos!',
        shareUrl,
      });
    }

    return NextResponse.json({
      success: true,
      pointsEarned: 5,
      message: 'Obrigado por compartilhar! +5 pontos',
      shareUrl,
    });
  } catch (error) {
    console.error('❌ [REFERRAL/SHARE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar compartilhamento' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/referral/share
 *
 * Gera URL de compartilhamento sem registrar pontos
 * Query params:
 * - type: 'victory' | 'invite'
 * - amount?: number
 * - roundName?: string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') as 'victory' | 'invite') || 'invite';
    const amount = searchParams.get('amount') ? parseFloat(searchParams.get('amount')!) : undefined;
    const roundName = searchParams.get('roundName') || undefined;

    // Buscar token de autenticação
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    let referralCode = 'MFLGAME'; // Default

    if (authToken) {
      const tokenRecord = await prisma.authToken.findUnique({
        where: { token: authToken },
        include: { user: true },
      });

      if (tokenRecord && tokenRecord.expiresAt >= new Date()) {
        referralCode = await ensureReferralCode(tokenRecord.user.id);
      }
    }

    const shareUrl = generateTwitterShareUrl({
      type,
      referralCode,
      amount,
      roundName,
    });

    return NextResponse.json({
      success: true,
      shareUrl,
      referralCode,
    });
  } catch (error) {
    console.error('❌ [REFERRAL/SHARE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar URL de compartilhamento' },
      { status: 500 }
    );
  }
}
