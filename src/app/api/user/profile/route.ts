import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Interface para os dados de atualização do perfil
interface ProfileUpdateData {
  name?: string;
  avatar?: string;
  twitter?: string;
  discord?: string;
  bio?: string;
}

// Função para validar os dados de entrada
function validateProfileData(data: ProfileUpdateData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('Nome deve ser uma string');
    } else if (data.name.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }
  }

  if (data.twitter !== undefined) {
    if (typeof data.twitter !== 'string') {
      errors.push('Twitter deve ser uma string');
    } else if (data.twitter.length > 50) {
      errors.push('Twitter deve ter no máximo 50 caracteres');
    }
  }

  if (data.discord !== undefined) {
    if (typeof data.discord !== 'string') {
      errors.push('Discord deve ser uma string');
    } else if (data.discord.length > 50) {
      errors.push('Discord deve ter no máximo 50 caracteres');
    }
  }

  if (data.bio !== undefined) {
    if (typeof data.bio !== 'string') {
      errors.push('Bio deve ser uma string');
    } else if (data.bio.length > 500) {
      errors.push('Bio deve ter no máximo 500 caracteres');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Função para obter o usuário autenticado
async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Buscar token do cookie ou header
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ [PROFILE] Token não encontrado');
      return null;
    }

    // Buscar token no banco
    const authToken = await prisma.authToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!authToken || authToken.expiresAt < new Date()) {
      console.log('❌ [PROFILE] Token inválido ou expirado');
      return null;
    }

    return authToken.userId;
  } catch (error) {
    console.error('❌ [PROFILE] Erro ao obter usuário:', error);
    return null;
  }
}

// Handler para GET - obter perfil do usuário
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    console.log('🔍 [PROFILE-GET] Buscando perfil para:', userId);

    // Buscar perfil no banco
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ [PROFILE-GET] Perfil encontrado:', user.email);

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('❌ [PROFILE-GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Handler para PUT - atualizar perfil do usuário
export async function PUT(request: NextRequest) {
  try {
    // Parse dos dados da requisição primeiro
    const body = await request.json();
    const { userId: bodyUserId, ...updateData }: ProfileUpdateData & { userId?: string } = body;

    // Tentar pegar userId do body OU do token
    let userId = bodyUserId;

    if (!userId) {
      // Fallback: tentar pegar do token
      const tokenUserId = await getUserFromRequest(request);
      userId = tokenUserId || undefined;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    console.log('📝 [PROFILE-UPDATE] Atualizando perfil:', {
      userId,
      fields: Object.keys(updateData)
    });

    // Validar dados de entrada
    const validation = validateProfileData(updateData);
    if (!validation.isValid) {
      console.error('❌ [PROFILE-UPDATE] Dados inválidos:', validation.errors);
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Atualizar perfil no banco
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    console.log('✅ [PROFILE-UPDATE] Perfil atualizado com sucesso:', {
      userId,
      email: updatedUser.email,
      name: updatedUser.name
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ [PROFILE-UPDATE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Handler para OPTIONS (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}