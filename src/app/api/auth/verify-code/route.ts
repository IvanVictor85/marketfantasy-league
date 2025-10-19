import { NextRequest, NextResponse } from 'next/server';
import { 
  verificationCodes, 
  authTokens, 
  users, 
  generateSessionToken, 
  createOrUpdateUser,
  AuthToken 
} from '@/lib/verification-storage';

interface VerifyCodeRequest {
  email: string;
  code: string;
}



export async function POST(request: NextRequest) {
  try {
    const body: VerifyCodeRequest = await request.json();
    const { email, code } = body;

    console.log(`🔍 [VERIFY] Tentativa de verificação para: ${email}`);
    console.log(`🔍 [VERIFY] Código recebido: ${code}`);

    // Validação dos dados
    if (!email || !code) {
      console.error(`❌ [VERIFY] Dados faltando - email: ${!!email}, code: ${!!code}`);
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      );
    }

    // Delay maior para evitar race condition (código sendo criado/verificado simultaneamente)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Tentar múltiplas vezes para encontrar o código (evitar race condition)
    let storedCode = verificationCodes.get(email);
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!storedCode && attempts < maxAttempts) {
      console.log(`🔄 [VERIFY] Tentativa ${attempts + 1}/${maxAttempts} - Código não encontrado, aguardando...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      storedCode = verificationCodes.get(email);
      attempts++;
    }

    console.log(`🔍 [VERIFY] Código armazenado encontrado: ${!!storedCode}`);
    if (storedCode) {
      console.log(`🔍 [VERIFY] Código armazenado: ${storedCode.code}`);
      console.log(`🔍 [VERIFY] Expira em: ${storedCode.expiresAt.toISOString()}`);
      console.log(`🔍 [VERIFY] Tentativas: ${storedCode.attempts}/3`);
    }

    if (!storedCode) {
      console.error(`❌ [VERIFY] Código não encontrado para ${email}`);
      return NextResponse.json(
        { error: 'Código não encontrado. Solicite um novo código.' },
        { status: 404 }
      );
    }

    // Verificar se o código expirou
    if (storedCode.expiresAt < new Date()) {
      verificationCodes.delete(email);
      return NextResponse.json(
        { error: 'Código expirado. Solicite um novo código.' },
        { status: 410 }
      );
    }

    // Verificar tentativas
    if (storedCode.attempts >= 3) {
      verificationCodes.delete(email);
      return NextResponse.json(
        { error: 'Muitas tentativas inválidas. Solicite um novo código.' },
        { status: 429 }
      );
    }

    // Verificar se o código está correto
    if (storedCode.code !== code) {
      storedCode.attempts++;
      console.error(`❌ [VERIFY] Código incorreto! Esperado: ${storedCode.code}, Recebido: ${code}`);
      console.error(`❌ [VERIFY] Tentativas restantes: ${3 - storedCode.attempts}`);
      
      // Só remover se excedeu tentativas
      if (storedCode.attempts >= 3) {
        verificationCodes.delete(email);
        console.log(`🗑️ [VERIFY] Código removido após 3 tentativas inválidas`);
      }
      
      return NextResponse.json(
        {
          error: 'Código inválido',
          attemptsLeft: 3 - storedCode.attempts
        },
        { status: 401 }
      );
    }

    console.log(`✅ [VERIFY] Código válido! Criando sessão para ${email}`);

    // Verificação dupla: garantir que o código ainda existe (evitar race condition)
    const finalCodeCheck = verificationCodes.get(email);
    if (!finalCodeCheck || finalCodeCheck.code !== code) {
      console.error(`❌ [VERIFY] Código foi removido ou alterado durante processamento`);
      return NextResponse.json(
        { error: 'Código expirado durante verificação. Tente novamente.' },
        { status: 410 }
      );
    }

    // Código válido! Criar ou atualizar usuário
    const user = createOrUpdateUser(email);
    
    // Gerar token de sessão
    const sessionToken = generateSessionToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    
    authTokens.set(sessionToken, {
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt: tokenExpiresAt
    });

    // Remover código usado
    verificationCodes.delete(email);
    console.log(`🗑️ [VERIFY] Código removido após uso bem-sucedido`);

    // Criar resposta com cookie de sessão
    const response = NextResponse.json({
      message: 'Autenticação realizada com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        twitter: user.twitter,
        discord: user.discord,
        bio: user.bio,
        loginMethod: 'email'
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

    return response;

  } catch (error) {
    console.error('Erro na API verify-code:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Função para validar token de sessão (para uso em outras APIs)
function validateAuthToken(token: string): AuthToken | null {
  const authToken = authTokens.get(token);
  
  if (!authToken) {
    return null;
  }
  
  if (authToken.expiresAt < new Date()) {
    authTokens.delete(token);
    return null;
  }
  
  return authToken;
}

// Função para obter usuário pelo token
function getUserByToken(token: string) {
  const authToken = validateAuthToken(token);
  if (!authToken) {
    return null;
  }
  
  return users.get(authToken.userId);
}

// Variáveis para uso interno da API