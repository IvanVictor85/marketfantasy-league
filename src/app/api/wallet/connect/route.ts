import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * POST /api/wallet/connect
 *
 * Vincula uma carteira Solana a um usuário existente (logado por email).
 * Implementa Sign-In with Solana (SIWS) para garantir que o usuário
 * realmente possui a chave privada da carteira que está vinculando.
 */

function createSignInMessage(nonce: string, walletAddress: string): Uint8Array {
  const message = `Bem-vindo ao MFL!

Clique para assinar e provar que você é o dono desta carteira.

Isso não custará nenhum SOL.

ID de Desafio (Nonce): ${nonce}
Carteira: ${walletAddress}`;

  return new TextEncoder().encode(message);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { email, nonce, signature, publicKey } = await request.json();

    console.log('🔗 [WALLET-CONNECT] Iniciando vinculação de carteira');

    if (!email || !nonce || !signature || !publicKey) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: email, nonce, signature, publicKey' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const dbNonce = await prisma.walletNonce.findUnique({ where: { nonce } });
    if (!dbNonce || dbNonce.used || new Date(dbNonce.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Nonce inválido ou expirado' }, { status: 403 });
    }

    try {
      const message = createSignInMessage(nonce, publicKey);
      const signatureUint8 = bs58.decode(signature);
      const publicKeyUint8 = bs58.decode(publicKey);

      const isVerified = nacl.sign.detached.verify(message, signatureUint8, publicKeyUint8);
      if (!isVerified) {
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 403 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao processar assinatura' }, { status: 400 });
    }

    await prisma.walletNonce.update({
      where: { id: dbNonce.id },
      data: { used: true, usedAt: new Date(), walletAddress: publicKey }
    });

    const existingWallet = await prisma.user.findFirst({
      where: { publicKey, id: { not: user.id } }
    });
    if (existingWallet) {
      return NextResponse.json({
        error: 'Esta carteira já está conectada a outra conta'
      }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { publicKey }
    });

    console.log('✅ [WALLET-CONNECT] Carteira vinculada com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Carteira vinculada com sucesso!',
      // ✅ CORREÇÃO: Retornar TODOS os campos do usuário
      user: updated // Retorna o objeto completo
    });

  } catch (error: any) {
    console.error('❌ [WALLET-CONNECT] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
