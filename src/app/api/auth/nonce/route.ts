import { NextRequest, NextResponse } from 'next/server';
import { generateNonce } from 'siwe';
import { prisma } from '@/lib/prisma';
import { rateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { getCorsHeaders } from '@/lib/cors';

/**
 * GET /api/auth/nonce
 *
 * Gera um nonce (número usado uma vez) seguro e aleatório para Sign-In with Solana (SIWS).
 * O nonce é usado para prevenir ataques de replay - cada tentativa de login precisa de um novo nonce.
 *
 * Fluxo de autenticação:
 * 1. Cliente solicita nonce (esta rota)
 * 2. Cliente cria mensagem incluindo o nonce
 * 3. Cliente assina a mensagem com sua chave privada
 * 4. Cliente envia mensagem assinada + assinatura para /api/auth/verify-wallet
 * 5. Servidor verifica a assinatura e autentica o usuário
 */
export async function GET(request: NextRequest) {
  // 🔒 RATE LIMITING: Prevenir spam de geração de nonces
  const rateLimitResult = await rateLimit(request, RATE_LIMITS.AUTH);
  if (!rateLimitResult.success) {
    logger.security('Tentativa de spam de nonces bloqueada');
    return rateLimitResponse(rateLimitResult.reset);
  }

  try {
    // Gerar nonce seguro usando a biblioteca SIWE
    const nonce = generateNonce();

    // Definir expiração do nonce (5 minutos)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    logger.debug('Gerando nonce para autenticação SIWS', { expiresAt });

    // Salvar nonce no banco de dados com expiração
    // NOTA: Precisaremos criar a tabela WalletNonce no schema do Prisma
    await prisma.walletNonce.create({
      data: {
        nonce,
        expiresAt,
        used: false
      }
    });

    logger.info('Nonce gerado e salvo com sucesso');

    // Retornar nonce para o cliente
    return NextResponse.json({
      nonce,
      expiresIn: 300, // 5 minutos em segundos
      message: 'Nonce gerado com sucesso'
    });

  } catch (error) {
    logger.error('Erro ao gerar nonce', error);

    return NextResponse.json(
      {
        error: 'Erro ao gerar nonce',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/auth/nonce
 * Handler para CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}
