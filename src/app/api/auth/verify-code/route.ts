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

    // Validação dos dados
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se existe código para este email
    const storedCode = verificationCodes.get(email);
    
    if (!storedCode) {
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
      return NextResponse.json(
        { 
          error: 'Código inválido',
          attemptsLeft: 3 - storedCode.attempts
        },
        { status: 401 }
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
export function validateAuthToken(token: string): AuthToken | null {
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
export function getUserByToken(token: string) {
  const authToken = validateAuthToken(token);
  if (!authToken) {
    return null;
  }
  
  return users.get(authToken.userId);
}

// Exportar para uso em outras APIs
export { authTokens, users };