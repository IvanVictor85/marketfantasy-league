import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction
} from '@solana/web3.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/vault/initialize
 *
 * Inicializa o vault do smart contract.
 * Apenas o admin pode chamar esta função.
 *
 * Requer: ADMIN_PRIVATE_KEY e CRON_SECRET configurados
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { secret } = body;

    // Verificar autorização
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar ADMIN_PRIVATE_KEY
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return NextResponse.json({
        error: 'ADMIN_PRIVATE_KEY não configurado',
        hint: 'Configure ADMIN_PRIVATE_KEY no Vercel com a private key do admin'
      }, { status: 500 });
    }

    // Configurações
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      (network === 'mainnet-beta'
        ? 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com');

    const programId = new PublicKey(
      process.env.NEXT_PUBLIC_PROGRAM_ID || 'KFbqeVcH7WemKHghyjdFByDpKSJQarWr378oK2ASfR5'
    );

    console.log(`🚀 [INIT-VAULT] Inicializando vault...`);
    console.log(`   Network: ${network}`);
    console.log(`   Program ID: ${programId.toString()}`);

    // Parse admin keypair
    let adminKeypair: Keypair;
    try {
      if (adminPrivateKey.startsWith('[')) {
        const secretKey = new Uint8Array(JSON.parse(adminPrivateKey));
        adminKeypair = Keypair.fromSecretKey(secretKey);
      } else {
        const bs58 = require('bs58');
        const secretKey = bs58.decode(adminPrivateKey);
        adminKeypair = Keypair.fromSecretKey(secretKey);
      }
    } catch (e) {
      return NextResponse.json({
        error: 'Erro ao parsear ADMIN_PRIVATE_KEY',
        details: e instanceof Error ? e.message : 'Formato inválido'
      }, { status: 500 });
    }

    console.log(`   Admin: ${adminKeypair.publicKey.toString()}`);

    const connection = new Connection(rpcUrl, 'confirmed');

    // Calcular vault PDA
    const [vaultPda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('mfl-vault')],
      programId
    );

    console.log(`   Vault PDA: ${vaultPda.toString()}`);
    console.log(`   Bump: ${bump}`);

    // Verificar se vault já existe
    const existingVault = await connection.getAccountInfo(vaultPda);
    if (existingVault) {
      // Parse para ver a authority
      const data = existingVault.data;
      const authority = new PublicKey(data.slice(8, 40));

      return NextResponse.json({
        success: false,
        error: 'Vault já existe',
        vault: {
          address: vaultPda.toString(),
          authority: authority.toString(),
          lamports: existingVault.lamports,
          dataLength: data.length
        },
        hint: 'O vault já foi inicializado. Use /api/vault/info para ver detalhes.'
      });
    }

    // Criar instrução initialize_vault
    // Discriminator do IDL: [48, 191, 163, 44, 71, 129, 63, 164]
    const discriminator = Buffer.from([48, 191, 163, 44, 71, 129, 63, 164]);

    const initializeInstruction = new TransactionInstruction({
      keys: [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId,
      data: discriminator,
    });

    // Criar e enviar transação
    const transaction = new Transaction().add(initializeInstruction);

    console.log(`📤 [INIT-VAULT] Enviando transação...`);

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [adminKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`✅ [INIT-VAULT] Vault inicializado com sucesso!`);
    console.log(`   TX: ${signature}`);

    // Verificar vault criado
    const newVault = await connection.getAccountInfo(vaultPda);
    let vaultInfo = null;
    if (newVault) {
      const data = newVault.data;
      const authority = new PublicKey(data.slice(8, 40));
      const totalPot = Number(data.slice(40, 48).readBigUInt64LE(0));

      vaultInfo = {
        address: vaultPda.toString(),
        authority: authority.toString(),
        totalPot,
        totalPotSol: totalPot / 1e9,
        lamports: newVault.lamports
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Vault inicializado com sucesso!',
      transaction: signature,
      network,
      programId: programId.toString(),
      vault: vaultInfo,
      explorer: `https://explorer.solana.com/tx/${signature}?cluster=${network}`
    });

  } catch (error) {
    console.error('❌ [INIT-VAULT] Erro:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    // Verificar erros comuns
    if (errorMessage.includes('already in use')) {
      return NextResponse.json({
        error: 'Vault já existe (conta já em uso)',
        details: errorMessage
      }, { status: 400 });
    }

    if (errorMessage.includes('insufficient funds')) {
      return NextResponse.json({
        error: 'Admin não tem SOL suficiente para pagar as taxas',
        details: errorMessage,
        hint: 'Envie SOL para a carteira admin'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erro ao inicializar vault',
      details: errorMessage
    }, { status: 500 });
  }
}

/**
 * GET /api/vault/initialize
 *
 * Retorna instruções de como inicializar o vault
 */
export async function GET(request: NextRequest) {
  const programId = process.env.NEXT_PUBLIC_PROGRAM_ID || 'KFbqeVcH7WemKHghyjdFByDpKSJQarWr378oK2ASfR5';

  // Calcular vault PDA
  const [vaultPda] = await PublicKey.findProgramAddress(
    [Buffer.from('mfl-vault')],
    new PublicKey(programId)
  );

  return NextResponse.json({
    message: 'Use POST para inicializar o vault',
    programId,
    expectedVaultAddress: vaultPda.toString(),
    usage: {
      method: 'POST',
      body: { secret: 'SEU_CRON_SECRET' },
      example: 'curl -X POST /api/vault/initialize -H "Content-Type: application/json" -d \'{"secret":"xxx"}\''
    },
    requirements: [
      'ADMIN_PRIVATE_KEY configurado',
      'CRON_SECRET configurado',
      'Admin deve ter SOL para taxas (~0.01 SOL)'
    ]
  });
}
