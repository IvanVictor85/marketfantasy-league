import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { buildRpcUrl } from '@/lib/helius/config';

export async function POST(request: NextRequest) {
  try {
    const { publicKey } = await request.json();

    if (!publicKey) {
      return NextResponse.json(
        { error: 'PublicKey é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 [API-BALANCE] Buscando saldo para:', publicKey);

    // Tentar múltiplos endpoints
    const endpoints = [
      buildRpcUrl(), // Helius com API key
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
      'https://api.devnet.solana.com',
      'https://devnet.helius-rpc.com/?api-key=demo'
    ].filter(Boolean);

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        console.log('🔄 [API-BALANCE] Tentando endpoint:', endpoint);

        const connection = new Connection(endpoint as string, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 10000
        });

        const pubKey = new PublicKey(publicKey);
        const lamports = await connection.getBalance(pubKey);
        const sol = (lamports / LAMPORTS_PER_SOL).toFixed(4);

        console.log('✅ [API-BALANCE] Saldo obtido:', {
          endpoint: endpoint?.substring(0, 50),
          lamports,
          sol
        });

        return NextResponse.json({
          success: true,
          balance: sol,
          lamports,
          endpoint: endpoint?.substring(0, 50)
        });

      } catch (err) {
        console.warn(`⚠️ [API-BALANCE] Endpoint ${endpoint?.substring(0, 50)} falhou:`, err);
        lastError = err;
        continue;
      }
    }

    // Se todos falharam
    console.error('❌ [API-BALANCE] Todos os endpoints falharam');
    throw lastError || new Error('Todos os RPC endpoints falharam');

  } catch (error) {
    console.error('❌ [API-BALANCE] Erro crítico:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar saldo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
