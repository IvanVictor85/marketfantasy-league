import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vault
 *
 * Retorna informações sobre o vault do smart contract:
 * - Saldo atual em SOL
 * - Endereço do vault PDA
 * - Status da configuração do admin
 * - Rede atual (devnet/mainnet)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Verificar secret para informações sensíveis
    const isAuthorized = secret === process.env.CRON_SECRET;

    // Configurações de rede
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      (network === 'mainnet-beta'
        ? 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com');

    const programId = process.env.NEXT_PUBLIC_PROGRAM_ID || '11111111111111111111111111111112';

    // Criar conexão
    const connection = new Connection(rpcUrl, 'confirmed');

    // Calcular vault PDA (seed: "mfl-vault")
    const [vaultPda] = await PublicKey.findProgramAddress(
      [Buffer.from('mfl-vault')],
      new PublicKey(programId)
    );

    // Buscar saldo do vault
    let vaultBalance = 0;
    let vaultExists = false;

    try {
      vaultBalance = await connection.getBalance(vaultPda);
      vaultExists = vaultBalance > 0 || (await connection.getAccountInfo(vaultPda)) !== null;
    } catch (error) {
      console.error('Erro ao buscar saldo do vault:', error);
    }

    // Verificar configuração do admin (sem expor a chave)
    const adminConfigured = !!process.env.ADMIN_PRIVATE_KEY;
    let adminPublicKey = null;

    if (isAuthorized && adminConfigured) {
      try {
        const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY!;

        if (adminPrivateKey.startsWith('[')) {
          const { Keypair } = await import('@solana/web3.js');
          const secretKey = new Uint8Array(JSON.parse(adminPrivateKey));
          const keypair = Keypair.fromSecretKey(secretKey);
          adminPublicKey = keypair.publicKey.toString();
        } else {
          const bs58 = require('bs58');
          const { Keypair } = await import('@solana/web3.js');
          const secretKey = bs58.decode(adminPrivateKey);
          const keypair = Keypair.fromSecretKey(secretKey);
          adminPublicKey = keypair.publicKey.toString();
        }
      } catch (error) {
        console.error('Erro ao parsear ADMIN_PRIVATE_KEY:', error);
      }
    }

    // Buscar prêmios pendentes
    let pendingPrizes = { count: 0, totalAmount: 0 };

    if (isAuthorized) {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const prizes = await prisma.prizeClaim.findMany({
          where: { claimed: false },
          select: { amount: true }
        });

        pendingPrizes = {
          count: prizes.length,
          totalAmount: prizes.reduce((sum, p) => sum + Number(p.amount), 0)
        };

        await prisma.$disconnect();
      } catch (error) {
        console.error('Erro ao buscar prêmios pendentes:', error);
      }
    }

    return NextResponse.json({
      success: true,
      network,
      programId,
      vault: {
        address: vaultPda.toString(),
        exists: vaultExists,
        balanceLamports: vaultBalance,
        balanceSol: vaultBalance / LAMPORTS_PER_SOL
      },
      admin: {
        configured: adminConfigured,
        publicKey: adminPublicKey // Só mostra se autorizado
      },
      pendingPrizes: isAuthorized ? pendingPrizes : { message: 'Use ?secret=XXX para ver' },
      canDistributePrizes: adminConfigured && vaultExists && vaultBalance > 0,
      rpcEndpoint: rpcUrl.replace(/api-key=[^&]+/, 'api-key=***') // Ocultar API key
    });

  } catch (error) {
    console.error('❌ [VAULT] Erro:', error);
    return NextResponse.json({
      error: 'Erro ao verificar vault',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
