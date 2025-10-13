import { NextRequest, NextResponse } from 'next/server';

// Interface para os dados do perfil do usuário
interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  walletAddress?: string;
  avatar?: string;
  twitter?: string;
  discord?: string;
  bio?: string;
  loginMethod: 'email' | 'wallet';
}

// Interface para os dados de atualização do perfil
interface ProfileUpdateData {
  name?: string;
  twitter?: string;
  discord?: string;
  bio?: string;
}

// Simulação de banco de dados em memória (em produção, usar um banco real)
const userProfiles = new Map<string, UserProfile>();

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

// Função para obter o usuário do localStorage (simulação de autenticação)
function getUserFromRequest(request: NextRequest): UserProfile | null {
  try {
    // Em uma aplicação real, você obteria o usuário do token JWT ou sessão
    // Por enquanto, vamos simular obtendo do header Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return null;
    }

    // Simular decodificação do token (em produção, usar JWT)
    const userData = JSON.parse(decodeURIComponent(authHeader.replace('Bearer ', '')));
    return userData;
  } catch (error) {
    console.error('Erro ao obter usuário da requisição:', error);
    return null;
  }
}

// Handler para GET - obter perfil do usuário
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar perfil salvo ou retornar o perfil atual
    const savedProfile = userProfiles.get(user.id) || user;

    return NextResponse.json({
      success: true,
      data: savedProfile
    });

  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Handler para PUT - atualizar perfil do usuário
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Parse dos dados da requisição
    const updateData: ProfileUpdateData = await request.json();

    // Validar dados de entrada
    const validation = validateProfileData(updateData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Obter perfil atual ou criar novo
    const currentProfile = userProfiles.get(user.id) || user;

    // Atualizar perfil com novos dados
    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...updateData,
      id: user.id, // Garantir que o ID não seja alterado
      loginMethod: user.loginMethod // Garantir que o método de login não seja alterado
    };

    // Salvar perfil atualizado
    userProfiles.set(user.id, updatedProfile);

    console.log(`Perfil atualizado para usuário ${user.id}:`, updateData);

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
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