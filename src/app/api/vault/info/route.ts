import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vault/info
 *
 * Lê os dados on-chain do vault para verificar a authority configurada
 */
export async function GET(request: NextRequest) {
  try {
    // Configurações
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      (network === 'mainnet-beta'
        ? 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com');

    const programId = new PublicKey(
      process.env.NEXT_PUBLIC_PROGRAM_ID || '7QHMrTeoLTggAy11kTTEwtoRzcvK8rEeY1TRu4oUdgGP'
    );

    const connection = new Connection(rpcUrl, 'confirmed');

    // Calcular vault PDA (seed: "mfl-vault")
    const [vaultPda] = await PublicKey.findProgramAddress(
      [Buffer.from('mfl-vault')],
      programId
    );

    console.log(`🔍 [VAULT-INFO] Buscando dados do vault: ${vaultPda.toString()}`);

    // Buscar dados da conta
    const accountInfo = await connection.getAccountInfo(vaultPda);

    if (!accountInfo) {
      return NextResponse.json({
        success: false,
        error: 'Vault não encontrado on-chain',
        vault: {
          address: vaultPda.toString(),
          exists: false
        }
      });
    }

    // Parse dos dados do Vault
    // Estrutura (segundo IDL):
    // - 8 bytes: discriminator do Anchor
    // - 32 bytes: authority (pubkey)
    // - 8 bytes: total_pot (u64)

    const data = accountInfo.data;

    // Discriminator do Anchor (primeiros 8 bytes)
    const discriminator = data.slice(0, 8);

    // Authority (próximos 32 bytes)
    const authorityBytes = data.slice(8, 40);
    const authority = new PublicKey(authorityBytes);

    // Total Pot (próximos 8 bytes, little-endian u64)
    const totalPotBytes = data.slice(40, 48);
    const totalPot = Number(totalPotBytes.readBigUInt64LE(0));

    // Verificar admin configurado
    let adminPublicKey = null;
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;

    if (adminPrivateKey) {
      try {
        const { Keypair } = await import('@solana/web3.js');

        if (adminPrivateKey.startsWith('[')) {
          const secretKey = new Uint8Array(JSON.parse(adminPrivateKey));
          adminPublicKey = Keypair.fromSecretKey(secretKey).publicKey.toString();
        } else {
          const bs58 = require('bs58');
          const secretKey = bs58.decode(adminPrivateKey);
          adminPublicKey = Keypair.fromSecretKey(secretKey).publicKey.toString();
        }
      } catch (e) {
        console.error('Erro ao parsear ADMIN_PRIVATE_KEY:', e);
      }
    }

    const authorityMatches = adminPublicKey === authority.toString();

    return NextResponse.json({
      success: true,
      network,
      programId: programId.toString(),
      vault: {
        address: vaultPda.toString(),
        exists: true,
        owner: accountInfo.owner.toString(),
        lamports: accountInfo.lamports,
        dataLength: data.length
      },
      vaultData: {
        discriminator: Array.from(discriminator),
        authority: authority.toString(),
        totalPot: totalPot,
        totalPotSol: totalPot / 1e9
      },
      admin: {
        configured: !!adminPublicKey,
        publicKey: adminPublicKey,
        matchesVaultAuthority: authorityMatches
      },
      diagnosis: authorityMatches
        ? '✅ Admin configurado corresponde à authority do vault'
        : `❌ MISMATCH! Admin (${adminPublicKey}) ≠ Vault Authority (${authority.toString()})`
    });

  } catch (error) {
    console.error('❌ [VAULT-INFO] Erro:', error);
    return NextResponse.json({
      error: 'Erro ao buscar informações do vault',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
