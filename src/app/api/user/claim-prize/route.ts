import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { claimPrize } from '@/lib/solana/program';

const prisma = new PrismaClient();

// ⚠️ DEVELOPMENT ONLY: Create admin keypair for server-side transactions
// In production, this should be loaded from secure environment variables or a secret manager
function getAdminKeypair(): Keypair {
  // For devnet testing, use a deterministic seed
  // In production, use: Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.ADMIN_PRIVATE_KEY!)))
  const seed = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    seed[i] = (i * 13 + 42) % 256;
  }
  return Keypair.fromSeed(seed);
}

// Create a mock wallet context for server-side signing
function createServerWalletContext(keypair: Keypair) {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async <T extends Transaction>(tx: T): Promise<T> => {
      tx.partialSign(keypair);
      return tx;
    },
    signAllTransactions: async <T extends Transaction>(txs: T[]): Promise<T[]> => {
      txs.forEach(tx => tx.partialSign(keypair));
      return txs;
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prizeId } = body;

    if (!prizeId) {
      return NextResponse.json(
        { error: 'prizeId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar prêmio
    const prize = await prisma.prizeClaim.findUnique({
      where: { id: prizeId }
    });

    if (!prize) {
      return NextResponse.json(
        { error: 'Prêmio não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já foi reclamado
    if (prize.claimed) {
      return NextResponse.json(
        { error: 'Este prêmio já foi resgatado' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: prize.userId },
      select: { id: true, publicKey: true, username: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se usuário tem wallet
    if (!user.publicKey) {
      return NextResponse.json(
        { error: 'Usuário não possui carteira conectada' },
        { status: 400 }
      );
    }

    // ✅ REAL BLOCKCHAIN TRANSACTION
    console.log('🏆 [CLAIM-PRIZE] Iniciando distribuição de prêmio via smart contract...');
    console.log(`   Prêmio ID: ${prizeId}`);
    console.log(`   Vencedor: ${user.publicKey}`);
    console.log(`   Valor: ${prize.amount.toString()} SOL`);

    let txHash: string;
    try {
      // Get admin keypair for server-side signing
      const adminKeypair = getAdminKeypair();
      const adminWalletContext = createServerWalletContext(adminKeypair) as any;

      console.log(`🔑 [CLAIM-PRIZE] Admin wallet: ${adminKeypair.publicKey.toString()}`);

      // Call the smart contract function
      const winnerPublicKey = new PublicKey(user.publicKey);
      const prizeAmount = parseFloat(prize.amount.toString());

      txHash = await claimPrize(
        adminWalletContext,
        winnerPublicKey,
        prizeAmount
      );

      console.log(`✅ [CLAIM-PRIZE] Prêmio distribuído com sucesso!`);
      console.log(`   TX Hash: ${txHash}`);
    } catch (error: any) {
      console.error('❌ [CLAIM-PRIZE] Erro ao distribuir prêmio via blockchain:', error);

      // Return detailed error to help debug
      return NextResponse.json(
        {
          error: 'Falha ao distribuir prêmio via blockchain',
          details: error.message || 'Erro desconhecido'
        },
        { status: 500 }
      );
    }

    // Atualizar prêmio como claimed com txHash real
    const updatedPrize = await prisma.prizeClaim.update({
      where: { id: prizeId },
      data: {
        claimed: true,
        claimedAt: new Date(),
        txHash: txHash // ✅ Real blockchain transaction hash
      }
    });

    const prizeAmount = parseFloat(updatedPrize.amount.toString());

    // Buscar nome da competição ou temporada
    let prizeName = 'Prêmio';
    if (prize.competitionId) {
      const competition = await prisma.competition.findUnique({
        where: { id: prize.competitionId },
        select: { name: true }
      });
      prizeName = competition?.name || 'Rodada';
    } else if (prize.seasonId) {
      const season = await prisma.season.findUnique({
        where: { id: prize.seasonId },
        select: { name: true }
      });
      prizeName = season?.name || 'Temporada';
    }

    return NextResponse.json({
      success: true,
      message: 'Prêmio resgatado com sucesso!',
      prize: {
        id: updatedPrize.id,
        amount: prizeAmount,
        name: prizeName,
        txHash: txHash // ✅ Real blockchain transaction hash
      },
      amount: prizeAmount
    });

  } catch (error) {
    console.error('❌ [API /user/claim-prize] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao resgatar prêmio' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
