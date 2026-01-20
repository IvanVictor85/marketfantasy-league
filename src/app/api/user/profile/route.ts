import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/cors';
import { rateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

// ✅ CORREÇÃO DE SEGURANÇA: Interface apenas com campos NÃO-IDENTIDADE permitidos
// Esta API não deve atualizar 'email' ou 'publicKey' para prevenir corrupção de dados
interface ProfileUpdateData {
  name?: string;
  username?: string;
  avatar?: string;
  twitter?: string;
  discord?: string;
  bio?: string;
  // NOTA: 'email', 'publicKey', 'walletAddress' NÃO SÃO PERMITIDOS aqui
  // Use APIs específicas para vincular identidades: /api/user/link-email, /api/user/link-wallet
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

  if (data.username !== undefined) {
    if (typeof data.username !== 'string') {
      errors.push('Username deve ser uma string');
    } else if (data.username.length < 3) {
      errors.push('Username deve ter no mínimo 3 caracteres');
    } else if (data.username.length > 30) {
      errors.push('Username deve ter no máximo 30 caracteres');
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push('Username deve conter apenas letras, números e underline');
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
  // 🔒 RATE LIMITING: Prevenir spam de atualizações de perfil
  const rateLimitResult = await rateLimit(request, RATE_LIMITS.AUTHENTICATED);
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult.reset);
  }

  try {
    // Parse dos dados da requisição primeiro
    const body = await request.json();

    // 🔍 LOGS CRÍTICOS
    console.log('🔍 [PROFILE] Body completo:', JSON.stringify(body, null, 2));
    console.log('🔍 [PROFILE] userId recebido:', body.userId);
    console.log('🔍 [PROFILE] Tipo do userId:', typeof body.userId);

    // ✅ CORREÇÃO: Extrair APENAS os campos seguros e permitidos
    // Ignorar 'email', 'publicKey', 'walletAddress' intencionalmente para prevenir corrupção
    const {
      userId: bodyUserId,
      name,
      username,
      avatar,
      twitter,
      discord,
      bio
    } = body;

    // Construir objeto de dados apenas com campos permitidos
    const updateData: ProfileUpdateData = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (twitter !== undefined) updateData.twitter = twitter;
    if (discord !== undefined) updateData.discord = discord;
    if (bio !== undefined) updateData.bio = bio;

    // Tentar pegar userId do body OU do token
    let userId = bodyUserId;

    if (!userId) {
      // Fallback: tentar pegar do token
      console.log('⚠️ [PROFILE] userId não veio no body, tentando token...');
      const tokenUserId = await getUserFromRequest(request);
      userId = tokenUserId || undefined;
      console.log('🔍 [PROFILE] userId do token:', userId);
    }

    if (!userId) {
      console.error('❌ [PROFILE] userId está vazio/null/undefined!');
      return NextResponse.json(
        { error: 'userId obrigatório' },
        { status: 400 }
      );
    }

    console.log('📝 [PROFILE-UPDATE] Atualizando perfil:', {
      userId,
      fields: Object.keys(updateData)
    });

    // 🔍 VERIFICAR SE USUÁRIO EXISTE ANTES DE TENTAR ATUALIZAR
    console.log('🔍 [PROFILE] Buscando usuário no banco...');
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('🔍 [PROFILE] Usuário encontrado?', !!userExists);

    if (!userExists) {
      console.error('❌ [PROFILE] Usuário não existe no banco!');
      console.error('❌ [PROFILE] userId buscado:', userId);

      // Listar alguns usuários para comparar
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true },
        take: 5
      });
      console.log('📋 [PROFILE] Primeiros 5 usuários no banco:', JSON.stringify(allUsers, null, 2));

      return NextResponse.json({
        error: 'Usuário não encontrado no banco de dados',
        receivedUserId: userId,
        hint: 'O userId fornecido não existe. Verifique se o usuário foi criado corretamente.'
      }, { status: 404 });
    }

    console.log('✅ [PROFILE] Usuário existe! Email:', userExists.email);

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

    // Verificar se username já existe (se estiver sendo atualizado)
    if (updateData.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: updateData.username }
      });

      if (existingUsername && existingUsername.id !== userId) {
        console.error('❌ [PROFILE] Username já existe:', updateData.username);
        return NextResponse.json(
          {
            error: 'Nome de usuário já está em uso',
            details: ['Este nome de usuário já está sendo usado por outro jogador']
          },
          { status: 400 }
        );
      }
    }

    // ✅ CORREÇÃO: Atualizar apenas com os campos seguros construídos acima
    console.log('💾 [PROFILE] Executando update no banco com campos seguros:', Object.keys(updateData));
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Se o avatar foi atualizado, atualizar também o mascote de todos os times do usuário
    if (updateData.avatar) {
      console.log('🎭 [PROFILE] Avatar atualizado, atualizando mascote dos times...');
      const teamsUpdated = await prisma.team.updateMany({
        where: { userId: userId },
        data: { selectedMascotUrl: updateData.avatar }
      });
      console.log(`✅ [PROFILE] ${teamsUpdated.count} time(s) atualizado(s) com novo mascote`);
    }

    // ✅ CORREÇÃO: Fazer refetch completo do usuário para garantir que retornamos todos os campos
    const completeUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!completeUser) {
      return NextResponse.json(
        { error: 'Erro ao buscar usuário atualizado' },
        { status: 500 }
      );
    }

    console.log('✅ [PROFILE-UPDATE] Perfil atualizado com sucesso:', {
      userId,
      email: completeUser.email,
      name: completeUser.name
    });

    return NextResponse.json({
      success: true,
      data: completeUser, // Retorna o usuário completo
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
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}