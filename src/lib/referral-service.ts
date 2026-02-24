/**
 * Referral Service - Sistema de Indicação e Recompensas
 *
 * Regras de Pontuação:
 * - SIGNUP: +50 pontos quando indicado se cadastra
 * - ROUND_PLAYED: +10 pontos quando indicado participa de rodada
 * - SOCIAL_SHARE: +5 pontos por compartilhar no Twitter
 * - FIRST_WIN: +25 pontos quando indicado ganha primeira vez
 * - STREAK_BONUS: +20 pontos por 5 indicados ativos consecutivos
 *
 * Tiers:
 * - BRONZE: 0-499 pontos
 * - SILVER: 500-1499 pontos
 * - GOLD: 1500-4999 pontos
 * - PLATINUM: 5000-9999 pontos
 * - DIAMOND: 10000+ pontos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configurações de pontuação
export const POINT_VALUES = {
  SIGNUP: 50,           // Indicado se cadastrou
  ROUND_PLAYED: 10,     // Indicado participou de rodada
  SOCIAL_SHARE: 5,      // Compartilhou no Twitter
  FIRST_WIN: 25,        // Indicado ganhou primeira vez
  STREAK_BONUS: 20,     // Bônus de sequência (5 indicados ativos)
} as const;

// Configurações de tiers
export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
  PLATINUM: 5000,
  DIAMOND: 10000,
} as const;

export type PointEventType = keyof typeof POINT_VALUES;
export type TierType = keyof typeof TIER_THRESHOLDS;

/**
 * Gera um código de referral único
 */
export function generateReferralCode(username?: string): string {
  const prefix = username
    ? username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
    : 'MFL';

  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${randomPart}`;
}

/**
 * Calcula o tier baseado nos pontos
 */
export function calculateTier(points: number): TierType {
  if (points >= TIER_THRESHOLDS.DIAMOND) return 'DIAMOND';
  if (points >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
  if (points >= TIER_THRESHOLDS.GOLD) return 'GOLD';
  if (points >= TIER_THRESHOLDS.SILVER) return 'SILVER';
  return 'BRONZE';
}

/**
 * Calcula pontos necessários para próximo tier
 */
export function getPointsToNextTier(currentPoints: number): { nextTier: TierType | null; pointsNeeded: number } {
  const currentTier = calculateTier(currentPoints);

  const tierOrder: TierType[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex >= tierOrder.length - 1) {
    return { nextTier: null, pointsNeeded: 0 }; // Já é DIAMOND
  }

  const nextTier = tierOrder[currentIndex + 1];
  const pointsNeeded = TIER_THRESHOLDS[nextTier] - currentPoints;

  return { nextTier, pointsNeeded };
}

/**
 * Cria ou atualiza o código de referral de um usuário
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, username: true },
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Se já tem código, retorna
  if (user.referralCode) {
    return user.referralCode;
  }

  // Gera novo código único
  let code = generateReferralCode(user.username || undefined);
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!existing) break;

    code = generateReferralCode(user.username || undefined);
    attempts++;
  }

  if (attempts >= maxAttempts) {
    // Fallback: usar ID parcial
    code = `MFL${userId.slice(-6).toUpperCase()}`;
  }

  // Salva o código
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code },
  });

  // Inicializa pontos se não existir
  await prisma.referralPoint.upsert({
    where: { userId },
    create: { userId, totalPoints: 0, tier: 'BRONZE' },
    update: {},
  });

  return code;
}

/**
 * Aplica código de referral durante cadastro
 */
export async function applyReferralCode(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; referrerId?: string; error?: string }> {
  try {
    // Busca o referenciador pelo código
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      select: { id: true },
    });

    if (!referrer) {
      return { success: false, error: 'Código de referral inválido' };
    }

    // Não pode se auto-indicar
    if (referrer.id === newUserId) {
      return { success: false, error: 'Você não pode usar seu próprio código' };
    }

    // Atualiza o novo usuário com o referenciador
    await prisma.user.update({
      where: { id: newUserId },
      data: { referredById: referrer.id },
    });

    // Adiciona pontos ao referenciador
    await addPoints(referrer.id, 'SIGNUP', {
      referredUserId: newUserId,
      description: 'Novo usuário cadastrado via seu link',
    });

    // Atualiza estatísticas do referenciador
    await prisma.referralPoint.upsert({
      where: { userId: referrer.id },
      create: {
        userId: referrer.id,
        totalPoints: POINT_VALUES.SIGNUP,
        tier: 'BRONZE',
        totalReferrals: 1,
      },
      update: {
        totalReferrals: { increment: 1 },
      },
    });

    return { success: true, referrerId: referrer.id };
  } catch (error) {
    console.error('Erro ao aplicar código de referral:', error);
    return { success: false, error: 'Erro interno ao processar indicação' };
  }
}

/**
 * Adiciona pontos ao usuário
 */
export async function addPoints(
  userId: string,
  eventType: PointEventType,
  options?: {
    referredUserId?: string;
    competitionId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ success: boolean; newTotal: number; newTier: TierType }> {
  const points = POINT_VALUES[eventType];

  try {
    // Registra o log de pontos
    await prisma.pointLog.create({
      data: {
        userId,
        eventType,
        points,
        description: options?.description || getDefaultDescription(eventType),
        referredUserId: options?.referredUserId,
        competitionId: options?.competitionId,
        metadata: options?.metadata,
      },
    });

    // Atualiza o total de pontos
    const updated = await prisma.referralPoint.upsert({
      where: { userId },
      create: {
        userId,
        totalPoints: points,
        tier: calculateTier(points),
      },
      update: {
        totalPoints: { increment: points },
      },
    });

    // Recalcula o tier
    const newTier = calculateTier(updated.totalPoints);
    if (newTier !== updated.tier) {
      await prisma.referralPoint.update({
        where: { userId },
        data: { tier: newTier },
      });
    }

    return {
      success: true,
      newTotal: updated.totalPoints + (updated.tier === newTier ? 0 : points),
      newTier,
    };
  } catch (error) {
    console.error('Erro ao adicionar pontos:', error);
    return { success: false, newTotal: 0, newTier: 'BRONZE' };
  }
}

/**
 * Registra participação em rodada (chamado quando indicado joga)
 */
export async function onReferredUserPlayed(
  referredUserId: string,
  competitionId: string
): Promise<void> {
  // Busca quem indicou este usuário
  const user = await prisma.user.findUnique({
    where: { id: referredUserId },
    select: { referredById: true },
  });

  if (!user?.referredById) return;

  // Verifica se já ganhou pontos por esta rodada específica
  const existingLog = await prisma.pointLog.findFirst({
    where: {
      userId: user.referredById,
      eventType: 'ROUND_PLAYED',
      referredUserId,
      competitionId,
    },
  });

  if (existingLog) return; // Já recebeu pontos por esta rodada

  // Adiciona pontos ao referenciador
  await addPoints(user.referredById, 'ROUND_PLAYED', {
    referredUserId,
    competitionId,
    description: 'Seu indicado participou de uma rodada',
  });

  // Atualiza contador de indicados ativos (primeira participação)
  const firstPlay = await prisma.pointLog.count({
    where: {
      userId: user.referredById,
      eventType: 'ROUND_PLAYED',
      referredUserId,
    },
  });

  if (firstPlay === 1) {
    await prisma.referralPoint.update({
      where: { userId: user.referredById },
      data: { activeReferrals: { increment: 1 } },
    });

    // Verifica bônus de sequência (5 indicados ativos)
    const stats = await prisma.referralPoint.findUnique({
      where: { userId: user.referredById },
    });

    if (stats && stats.activeReferrals % 5 === 0) {
      await addPoints(user.referredById, 'STREAK_BONUS', {
        description: `Bônus: ${stats.activeReferrals} indicados ativos!`,
      });
    }
  }
}

/**
 * Registra vitória de indicado (chamado quando indicado ganha pela primeira vez)
 */
export async function onReferredUserWon(
  referredUserId: string,
  competitionId: string
): Promise<void> {
  // Busca quem indicou este usuário
  const user = await prisma.user.findUnique({
    where: { id: referredUserId },
    select: { referredById: true },
  });

  if (!user?.referredById) return;

  // Verifica se já ganhou pontos por FIRST_WIN deste indicado
  const existingLog = await prisma.pointLog.findFirst({
    where: {
      userId: user.referredById,
      eventType: 'FIRST_WIN',
      referredUserId,
    },
  });

  if (existingLog) return; // Já recebeu pontos pela primeira vitória deste indicado

  // Adiciona pontos ao referenciador
  await addPoints(user.referredById, 'FIRST_WIN', {
    referredUserId,
    competitionId,
    description: 'Seu indicado venceu uma rodada!',
  });
}

/**
 * Registra compartilhamento social
 */
export async function onSocialShare(
  userId: string,
  platform: 'twitter' | 'discord',
  metadata?: { tweetUrl?: string; competitionId?: string }
): Promise<{ success: boolean; alreadyShared?: boolean }> {
  // Limita a 1 share por dia por plataforma
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingToday = await prisma.pointLog.findFirst({
    where: {
      userId,
      eventType: 'SOCIAL_SHARE',
      createdAt: { gte: today },
      metadata: { path: ['platform'], equals: platform },
    },
  });

  if (existingToday) {
    return { success: false, alreadyShared: true };
  }

  await addPoints(userId, 'SOCIAL_SHARE', {
    description: `Compartilhou no ${platform === 'twitter' ? 'X (Twitter)' : 'Discord'}`,
    competitionId: metadata?.competitionId,
    metadata: { platform, ...metadata },
  });

  return { success: true };
}

/**
 * Busca estatísticas de referral do usuário
 */
export async function getReferralStats(userId: string) {
  const [user, points, recentLogs, referrals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    }),
    prisma.referralPoint.findUnique({
      where: { userId },
    }),
    prisma.pointLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        name: true,
        publicKey: true,
        createdAt: true,
        userTeams: { select: { id: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Calcula ranking
  const ranking = await prisma.referralPoint.count({
    where: {
      totalPoints: { gt: points?.totalPoints || 0 },
    },
  });

  const totalUsers = await prisma.referralPoint.count();

  return {
    referralCode: user?.referralCode || null,
    totalPoints: points?.totalPoints || 0,
    tier: points?.tier || 'BRONZE',
    totalReferrals: points?.totalReferrals || 0,
    activeReferrals: points?.activeReferrals || 0,
    rank: ranking + 1,
    totalUsers,
    nextTier: getPointsToNextTier(points?.totalPoints || 0),
    recentActivity: recentLogs.map((log) => ({
      id: log.id,
      type: log.eventType,
      points: log.points,
      description: log.description,
      createdAt: log.createdAt,
    })),
    referrals: referrals.map((r) => ({
      id: r.id,
      name: r.name,
      wallet: r.publicKey ? `${r.publicKey.slice(0, 4)}...${r.publicKey.slice(-4)}` : null,
      joinedAt: r.createdAt,
      isActive: r.userTeams.length > 0,
    })),
  };
}

/**
 * Busca leaderboard de referrals
 */
export async function getReferralLeaderboard(limit: number = 10) {
  const leaderboard = await prisma.referralPoint.findMany({
    orderBy: { totalPoints: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          publicKey: true,
          username: true,
        },
      },
    },
  });

  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    name: entry.user.name,
    username: entry.user.username,
    wallet: entry.user.publicKey
      ? `${entry.user.publicKey.slice(0, 4)}...${entry.user.publicKey.slice(-4)}`
      : null,
    totalPoints: entry.totalPoints,
    tier: entry.tier,
    totalReferrals: entry.totalReferrals,
  }));
}

/**
 * Gera URL de compartilhamento para Twitter
 */
export function generateTwitterShareUrl(options: {
  type: 'victory' | 'invite';
  referralCode: string;
  amount?: number;
  roundName?: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mfl.gg';
  const referralLink = `${baseUrl}/ref/${options.referralCode}`;

  let text: string;

  if (options.type === 'victory' && options.amount) {
    text = `Acabei de ganhar ${options.amount.toFixed(4)} SOL ${options.roundName ? `na ${options.roundName}` : ''} do @MFLProtocol! \n\nJogue comigo: ${referralLink}\n\n#Solana #MFL #CryptoFantasy #Web3Gaming`;
  } else {
    text = `Acha que seu feeling de mercado é o melhor? Prove no @MFLProtocol 🚀\n\nEscolha seus ativos favoritos e dispute rodadas globais na @Solana. O fantasy crypto definitivo.\n\nEntre pelo meu link: ${referralLink}\n\n#Solana #MFL #MarketFantasyLeague`;
  }

  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

// Helpers
function getDefaultDescription(eventType: PointEventType): string {
  const descriptions: Record<PointEventType, string> = {
    SIGNUP: 'Novo usuário cadastrado via seu link',
    ROUND_PLAYED: 'Seu indicado participou de uma rodada',
    SOCIAL_SHARE: 'Compartilhamento nas redes sociais',
    FIRST_WIN: 'Seu indicado ganhou pela primeira vez',
    STREAK_BONUS: 'Bônus de indicados ativos',
  };
  return descriptions[eventType];
}
