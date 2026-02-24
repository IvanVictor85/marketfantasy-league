import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

// Whitelist de métodos RPC permitidos pelo proxy
// Apenas os métodos efetivamente usados pelo frontend
const ALLOWED_RPC_METHODS = new Set([
  'getPriorityFeeEstimate',
  'getRecentPrioritizationFees',
]);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting por IP
    const { success, reset } = await rateLimit(request, RATE_LIMITS.RPC_PROXY);
    if (!success) {
      return rateLimitResponse(reset);
    }

    const apiKey = process.env.HELIUS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Helius API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validar que o método RPC está na whitelist
    const method = body?.method;
    if (!method || !ALLOWED_RPC_METHODS.has(method)) {
      console.warn(`⚠️ [HELIUS-PROXY] Método RPC bloqueado: ${method}`);
      return NextResponse.json(
        { error: `RPC method not allowed: ${method}` },
        { status: 403 }
      );
    }

    // Determine network from environment or default to devnet
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const rpcUrl = network === 'mainnet-beta' || network === 'mainnet'
      ? 'https://mainnet.helius-rpc.com'
      : 'https://devnet.helius-rpc.com';

    const url = `${rpcUrl}?api-key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Helius API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in Helius RPC proxy:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
