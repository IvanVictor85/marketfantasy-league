import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { rateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { getCorsHeaders } from '@/lib/cors';

// Função para gerar token de sessão
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

interface VerifyCodeRequest {
  email: string;
  code: string;
}



export async function POST(request: NextRequest) {
  // 🔒 RATE LIMITING: Prevenir ataques de força bruta
  const rateLimitResult = await rateLimit(request, RATE_LIMITS.AUTH);
  if (!rateLimitResult.success) {
    logger.security('Tentativa de força bruta em verificação de código bloqueada');
    return rateLimitResponse(rateLimitResult.reset);
  }

  try {
    const body: VerifyCodeRequest = await request.json();
    const { email, code } = body;

    logger.info('Tentativa de verificação de código', { email, hasCode: !!code });

    // Validação dos dados
    if (!email || !code) {
      logger.warn('Dados faltando na verificação', { hasEmail: !!email, hasCode: !!code });
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      );
    }

    // 🔧 BUSCAR CÓDIGO NO BANCO COM RETRY (5 tentativas de 1 segundo)
    let storedCode = null;
    const maxRetries = 5;
    const retryDelay = 1000; // 1 segundo

    for (let i = 0; i < maxRetries; i++) {
      storedCode = await prisma.verificationCode.findUnique({
        where: { email }
      });

      if (storedCode) {
        console.log(`✅ [VERIFY] Código encontrado na tentativa ${i + 1}/${maxRetries}`);
        break;
      }

      if (i < maxRetries - 1) {
        console.log(`🔄 [VERIFY] Tentativa ${i + 1}/${maxRetries} - Código não encontrado, aguardando ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    console.log(`🔍 [VERIFY] Código armazenado encontrado: ${!!storedCode}`);
    if (storedCode) {
      console.log(`🔍 [VERIFY] Código armazenado: ${storedCode.code}`);
      console.log(`🔍 [VERIFY] Expira em: ${storedCode.expiresAt.toISOString()}`);
      console.log(`🔍 [VERIFY] Tentativas: ${storedCode.attempts}/3`);
    }

    if (!storedCode) {
      console.error(`❌ [VERIFY] Código não encontrado para ${email} após ${maxRetries} tentativas`);
      return NextResponse.json(
        { error: 'Código não encontrado. Solicite um novo código.' },
        { status: 404 }
      );
    }

    // Verificar se o código expirou
    if (storedCode.expiresAt < new Date()) {
      await prisma.verificationCode.delete({
        where: { email }
      });
      console.log(`🗑️ [VERIFY] Código expirado removido do banco`);
      return NextResponse.json(
        { error: 'Código expirado. Solicite um novo código.' },
        { status: 410 }
      );
    }

    // Verificar tentativas
    if (storedCode.attempts >= 3) {
      await prisma.verificationCode.delete({
        where: { email }
      });
      console.log(`🗑️ [VERIFY] Código removido após exceder tentativas`);
      return NextResponse.json(
        { error: 'Muitas tentativas inválidas. Solicite um novo código.' },
        { status: 429 }
      );
    }

    // Verificar se o código está correto
    if (storedCode.code !== code) {
      // Incrementar tentativas no banco
      await prisma.verificationCode.update({
        where: { email },
        data: {
          attempts: storedCode.attempts + 1
        }
      });

      console.error(`❌ [VERIFY] Código incorreto! Esperado: ${storedCode.code}, Recebido: ${code}`);
      console.error(`❌ [VERIFY] Tentativas restantes: ${3 - (storedCode.attempts + 1)}`);

      // Remover se excedeu tentativas
      if (storedCode.attempts + 1 >= 3) {
        await prisma.verificationCode.delete({
          where: { email }
        });
        console.log(`🗑️ [VERIFY] Código removido após 3 tentativas inválidas`);
      }

      return NextResponse.json(
        {
          error: 'Código inválido',
          attemptsLeft: 3 - (storedCode.attempts + 1)
        },
        { status: 401 }
      );
    }

    console.log(`✅ [VERIFY] Código válido! Criando sessão para ${email}`);

    // Código válido! Criar ou atualizar usuário
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: email.split('@')[0]
      }
    });

    console.log(`✅ [VERIFY] Usuário criado/atualizado:`, {
      id: user.id,
      email: user.email,
      name: user.name
    });

    // Gerar token de sessão
    const sessionToken = generateSessionToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: tokenExpiresAt
      }
    });

    console.log(`✅ [VERIFY] Token de sessão criado:`, {
      token: sessionToken.substring(0, 10) + '...',
      expiresAt: tokenExpiresAt
    });

    // Remover código usado do banco
    await prisma.verificationCode.delete({
      where: { email }
    });
    console.log(`🗑️ [VERIFY] Código removido após uso bem-sucedido`);

    // Criar resposta com cookie de sessão
    const response = NextResponse.json({
      message: 'Autenticação realizada com sucesso',
      // ✅ CORREÇÃO: Retornar TODOS os campos do usuário
      user: {
        ...user,
        loginMethod: 'email' // Apenas adicionar este campo extra
      },
      token: sessionToken
    });

    // Definir cookie de sessão
    response.cookies.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 horas
    });

    console.log(`🎉 [VERIFY] Autenticação completa com sucesso para ${email}`);
    return response;

  } catch (error) {
    console.error('❌ [VERIFY] Erro na API verify-code:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}