import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Connection, PublicKey } from '@solana/web3.js'
import { rateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// ✅ REFATORAÇÃO: Pagamento por competitionId (Rodada), não leagueId (Liga)
const confirmEntrySchema = z.object({
  transactionHash: z.string().min(64, 'Invalid transaction hash'),
  competitionId: z.string()
})

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
    logger.error('[AUTH] Erro ao obter usuário', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 SEGURANÇA: Rate Limiting (3 pagamentos por 5 minutos)
    const rateLimitResult = await rateLimit(request, {
      interval: 300000, // 5 minutos
      uniqueTokenPerInterval: 3, // 3 pagamentos por 5 minutos
    });

    if (!rateLimitResult.success) {
      logger.security('[CONFIRM-ENTRY] Rate limit excedido', {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      });
      return rateLimitResponse(rateLimitResult.reset);
    }

    // 🔒 SEGURANÇA: Obter userId do usuário autenticado
    const userId = await getUserFromRequest(request);

    if (!userId) {
      logger.security('[CONFIRM-ENTRY] Tentativa de pagamento sem autenticação');
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
      logger.warn('[CONFIRM-ENTRY] Usuário sem carteira vinculada', { userId });
      return NextResponse.json(
        { error: 'Você precisa conectar uma carteira antes de confirmar entrada' },
        { status: 400 }
      );
    }

    const userWallet = user.publicKey; // 🔒 SEGURANÇA: Usando carteira do banco, não do cliente!

    const body = await request.json()
    logger.debug('[CONFIRM-ENTRY] Request body recebido');

    const { transactionHash, competitionId } = confirmEntrySchema.parse(body)

    if (!competitionId) {
      return NextResponse.json(
        { error: 'ID da Rodada (competitionId) é obrigatório' },
        { status: 400 }
      );
    }

    logger.info('[CONFIRM-ENTRY] Confirmando pagamento', {
      userId,
      competitionId,
      txHash: transactionHash.substring(0, 8) + '...'
    });

    // ✅ REFATORAÇÃO: Buscar a Rodada (Competition) e sua Liga (League)
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: true,
        season: true
      }
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Rodada não encontrada' },
        { status: 404 }
      );
    }

    // 🔒 VALIDAÇÃO: Bloquear inscrição em rodadas ACTIVE ou COMPLETED
    if (competition.status === 'ACTIVE') {
      logger.security('[CONFIRM-ENTRY] Tentativa de inscrição em rodada ACTIVE', { userId, competitionId });
      return NextResponse.json(
        { error: 'As inscrições foram encerradas. Esta rodada já está em andamento.' },
        { status: 403 }
      );
    }

    if (competition.status === 'COMPLETED') {
      logger.security('[CONFIRM-ENTRY] Tentativa de inscrição em rodada COMPLETED', { userId, competitionId });
      return NextResponse.json(
        { error: 'Esta rodada já foi encerrada.' },
        { status: 403 }
      );
    }

    const league = competition.league;
    const entryFee = Number(league.entryFee); // ex: 0.1 SOL

    // Verificar se entrada já existe
    const existingEntry = await prisma.leagueEntry.findFirst({
      where: {
        userId: userId,
        competitionId: competitionId,
        status: 'CONFIRMED'
      }
    });

    if (existingEntry) {
      logger.info('[CONFIRM-ENTRY] Entrada já confirmada anteriormente', { userId, competitionId });
      return NextResponse.json({
        success: true,
        message: 'Entrada já confirmada',
        entry: {
          transactionHash: existingEntry.transactionHash,
          amountPaid: existingEntry.amountPaid,
          createdAt: existingEntry.createdAt
        }
      });
    }

    // Verify transaction on-chain
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    logger.debug('[CONFIRM-ENTRY] Conectando RPC');
    const connection = new Connection(rpcUrl)

    let transaction
    try {
      logger.debug('[CONFIRM-ENTRY] Buscando transação on-chain');
      transaction = await connection.getTransaction(transactionHash, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      })

      if (!transaction) {
        logger.warn('[CONFIRM-ENTRY] Transação não encontrada', { txHash: transactionHash.substring(0, 8) + '...' });
      }
    } catch (error) {
      logger.error('[CONFIRM-ENTRY] Erro ao buscar transação', error);
      return NextResponse.json(
        { error: 'Transação não encontrada na blockchain' },
        { status: 404 }
      )
    }

    if (!transaction || !transaction.meta) {
      logger.error('[CONFIRM-ENTRY] Transação inválida ou sem meta');
      return NextResponse.json(
        { error: 'Transação inválida ou não confirmada' },
        { status: 400 }
      )
    }

    // Verify transaction details
    const entryFeeInLamports = league.entryFee * 1_000_000_000 // Convert SOL to lamports
    const userPublicKey = new PublicKey(userWallet)

    // Check if the transaction involves the user's wallet
    const accountKeys = transaction.transaction.message.getAccountKeys()
    const accountKeysArray = Array.from(accountKeys.keySegments()).flat()
    const userAccountIndex = accountKeysArray.findIndex((key: PublicKey) => key.equals(userPublicKey))

    if (userAccountIndex === -1) {
      logger.security('[CONFIRM-ENTRY] Transação não pertence à carteira do usuário', { userId });
      return NextResponse.json(
        { error: 'Transação não pertence à carteira informada' },
        { status: 400 }
      )
    }

    // Verify the amount transferred
    const preBalance = transaction.meta.preBalances[userAccountIndex]
    const postBalance = transaction.meta.postBalances[userAccountIndex]
    const amountTransferred = preBalance - postBalance

    logger.debug('[CONFIRM-ENTRY] Valores da transação', {
      entryFeeSol: league.entryFee,
      entryFeeLamports: entryFeeInLamports,
      amountTransferredSol: amountTransferred / 1_000_000_000
    });

    // Allow for small transaction fee differences
    const tolerance = 0.001 * 1_000_000_000 // 0.001 SOL tolerance for fees
    const difference = Math.abs(amountTransferred - entryFeeInLamports)

    if (difference > tolerance) {
      logger.security('[CONFIRM-ENTRY] Valor da transação incorreto', {
        expected: league.entryFee,
        actual: amountTransferred / 1_000_000_000,
        difference: difference / 1_000_000_000
      });
      return NextResponse.json(
        {
          error: 'Valor da transação não corresponde à taxa de entrada',
          expected: league.entryFee,
          actual: amountTransferred / 1_000_000_000,
          difference: difference / 1_000_000_000,
          tolerance: tolerance / 1_000_000_000
        },
        { status: 400 }
      )
    }

    // ✅ LÓGICA DE DISTRIBUIÇÃO DE PRÊMIO
    const seasonCut = entryFee * 0.18;    // 18% Temporada
    const treasuryCut = entryFee * 0.12;  // 12% Tesouro
    const roundCut = entryFee * 0.70;     // 70% Rodada

    logger.info('[CONFIRM-ENTRY] Distribuição de prêmio', {
      entryFee,
      seasonCut,
      treasuryCut,
      roundCut
    });

    // ✅ REFATORAÇÃO: Criar entrada e atualizar prêmios em transação atômica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar LeagueEntry ligada à competitionId
      const newEntry = await tx.leagueEntry.create({
        data: {
          userId: userId,
          userWallet: userWallet,
          competitionId: competitionId,
          transactionHash: transactionHash,
          amountPaid: entryFee,
          status: 'CONFIRMED',
          blockHeight: Number(transaction.slot)
        }
      });

      // 2. Atualizar prizePool da Temporada (18%)
      if (competition.seasonId) {
        await tx.season.update({
          where: { id: competition.seasonId },
          data: { prizePool: { increment: seasonCut } }
        });
      }

      // 3. Atualizar prizePool da Rodada (70%)
      await tx.competition.update({
        where: { id: competitionId },
        data: { prizePool: { increment: roundCut } }
      });

      // 4. (TODO) Enviar 12% para o Tesouro
      // Implementar lógica de tesouro aqui

      return newEntry;
    });

    logger.info('[CONFIRM-ENTRY] Pagamento confirmado com sucesso', {
      userId,
      competitionId,
      seasonCut,
      roundCut,
      treasuryCut
    });

    return NextResponse.json({
      success: true,
      message: 'Entrada confirmada com sucesso',
      entry: {
        transactionHash: result.transactionHash,
        amountPaid: result.amountPaid,
        createdAt: result.createdAt
      },
      prizeDistribution: {
        season: seasonCut,
        round: roundCut,
        treasury: treasuryCut
      }
    })

  } catch (error) {
    logger.error('[CONFIRM-ENTRY] Erro ao confirmar entrada', error);

    if (error instanceof z.ZodError) {
      logger.warn('[CONFIRM-ENTRY] Erro de validação', { errors: error.errors });
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
