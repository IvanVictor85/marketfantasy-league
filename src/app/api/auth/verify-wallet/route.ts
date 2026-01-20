import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { getCorsHeaders } from '@/lib/cors';

/**
 * POST /api/auth/verify-wallet
 *
 * Verifica a assinatura da carteira Solana e autentica o usuário.
 * Implementa "Sign-In with Solana" (SIWS) para garantir que o usuário
 * realmente possui a chave privada da carteira que está conectando.
 *
 * Fluxo de autenticação:
 * 1. Recebe nonce, assinatura e publicKey
 * 2. Valida nonce no banco (existe, não expirou, não foi usado)
 * 3. Verifica assinatura criptográfica com TweetNaCl
 * 4. Marca nonce como usado
 * 5. Cria/atualiza usuário no banco
 * 6. Cria sessão autenticada (cookie httpOnly)
 */

/**
 * Cria a mensagem que o usuário deve assinar no frontend.
 * IMPORTANTE: Esta mensagem DEVE SER IDÊNTICA à criada no frontend!
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
    const { nonce, signature, publicKey } = await request.json();

    logger.info('Iniciando verificação de assinatura SIWS', {
      publicKeyPrefix: publicKey?.substring(0, 8),
      hasNonce: !!nonce,
      hasSignature: !!signature,
    });

    // Validação de campos obrigatórios
    if (!nonce || !signature || !publicKey) {
      logger.warn('Campos obrigatórios faltando na verificação de wallet');
      return NextResponse.json(
        { error: 'Campos obrigatórios: nonce, signature, publicKey' },
        { status: 400 }
      );
    }

    // ============================================
    // ETAPA 1: VERIFICAR O NONCE NO BANCO DE DADOS
    // ============================================
    logger.debug('Verificando nonce no banco de dados');

    const dbNonce = await prisma.walletNonce.findUnique({
      where: { nonce: nonce },
    });

    if (!dbNonce) {
      logger.security('Tentativa de autenticação com nonce inválido', { publicKey });
      return NextResponse.json(
        { error: 'Nonce inválido ou não encontrado' },
        { status: 403 }
      );
    }

    if (dbNonce.used) {
      logger.security('Tentativa de reutilizar nonce já usado', { publicKey });
      return NextResponse.json(
        { error: 'Este nonce já foi utilizado. Solicite um novo.' },
        { status: 403 }
      );
    }

    if (new Date(dbNonce.expiresAt) < new Date()) {
      console.error('❌ [VERIFY-WALLET] Nonce expirado');
      return NextResponse.json(
        { error: 'Nonce expirado. Solicite um novo.' },
        { status: 403 }
      );
    }

    console.log('✅ [VERIFY-WALLET] Nonce válido e não utilizado');

    // ============================================
    // ETAPA 2: VERIFICAR A ASSINATURA (CORE DO SIWS)
    // ============================================
    console.log('🔐 [VERIFY-WALLET] Verificando assinatura criptográfica...');

    try {
      // Criar a mensagem que deveria ter sido assinada
      const message = createSignInMessage(nonce, publicKey);

      // Decodificar a assinatura e a chave pública de base58 para Uint8Array
      const signatureUint8 = bs58.decode(signature);
      const publicKeyUint8 = bs58.decode(publicKey);

      console.log(`   Tamanho da assinatura: ${signatureUint8.length} bytes`);
      console.log(`   Tamanho da publicKey: ${publicKeyUint8.length} bytes`);

      // Verificar a assinatura usando TweetNaCl (Ed25519)
      const isVerified = nacl.sign.detached.verify(
        message,
        signatureUint8,
        publicKeyUint8
      );

      if (!isVerified) {
        console.error('❌ [VERIFY-WALLET] Assinatura inválida!');
        return NextResponse.json(
          { error: 'Assinatura inválida. Você não é o dono desta carteira.' },
          { status: 403 }
        );
      }

      console.log('✅ [VERIFY-WALLET] Assinatura verificada com sucesso!');

    } catch (error) {
      console.error('❌ [VERIFY-WALLET] Erro ao verificar assinatura:', error);
      return NextResponse.json(
        { error: 'Erro ao processar assinatura. Verifique o formato.' },
        { status: 400 }
      );
    }

    // ============================================
    // ETAPA 3: MARCAR NONCE COMO USADO
    // ============================================
    console.log('💾 [VERIFY-WALLET] Marcando nonce como usado...');

    await prisma.walletNonce.update({
      where: { id: dbNonce.id },
      data: {
        used: true,
        usedAt: new Date(),
        walletAddress: publicKey,
      },
    });

    console.log('✅ [VERIFY-WALLET] Nonce marcado como usado');

    // ============================================
    // ETAPA 4: CRIAR/ATUALIZAR USUÁRIO
    // ============================================
    console.log('👤 [VERIFY-WALLET] Buscando/criando usuário...');

    let user = await prisma.user.findUnique({
      where: { publicKey: publicKey }
    });

    if (user) {
      console.log(`✅ [VERIFY-WALLET] Usuário existente encontrado: ${user.id}`);
    } else {
      // ✅ CORREÇÃO: Criar novo usuário SEM email fake
      // O email deve ser null até o usuário verificar um email real via /perfil
      user = await prisma.user.create({
        data: {
          email: null, // ❌ NÃO criar email fake @wallet.mfl
          publicKey: publicKey,
          name: `Usuário ${publicKey.substring(0, 8)}`, // Nome temporário
        }
      });
      console.log(`✅ [VERIFY-WALLET] Novo usuário criado (sem email): ${user.id}`);
    }

    // ============================================
    // ETAPA 5: CRIAR SESSÃO (Cookie httpOnly)
    // ============================================
    console.log('🍪 [VERIFY-WALLET] Criando sessão autenticada...');

    // Gerar token de sessão seguro (64 caracteres)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Salvar token no banco
    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: expiresAt,
      }
    });

    console.log('✅ [VERIFY-WALLET] Token de sessão criado');

    // Preparar resposta com cookie
    const response = NextResponse.json({
      success: true,
      message: 'Carteira verificada e autenticada com sucesso!',
      // ✅ CORREÇÃO: Retornar TODOS os campos do usuário
      user: {
        ...user,
        loginMethod: 'wallet' // Adicionar campo extra para indicar método de login
      },
      // ✅ Retornar token para persistência no localStorage (permite F5 sem perder sessão)
      token: sessionToken
    });

    // Definir cookie httpOnly com o token de sessão
    response.cookies.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas em segundos
      path: '/',
    });

    const duration = Date.now() - startTime;
    console.log('');
    console.log('✅ ========================================');
    console.log('✅ AUTENTICAÇÃO DE CARTEIRA CONCLUÍDA');
    console.log('✅ ========================================');
    console.log(`   Usuário: ${user.id}`);
    console.log(`   Carteira: ${publicKey.substring(0, 12)}...`);
    console.log(`   Duração: ${duration}ms`);
    console.log('');

    return response;

  } catch (error) {
    console.error('❌ [VERIFY-WALLET] Erro crítico:', error);

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/auth/verify-wallet
 * Handler para CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}
