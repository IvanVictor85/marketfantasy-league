import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/user/link-email
 *
 * Vincula um email a uma conta de usuário que fez login com carteira.
 * Requer verificação do código de verificação antes de vincular.
 * ✅ ATUALIZADO: Agora também aceita e salva TODOS os dados do perfil em uma única transação.
 * ✅ CORREÇÃO DE SEGURANÇA: Obtém userId da sessão (token), não do body.
 */

// ✅ CORREÇÃO: Função para obter o usuário autenticado a partir do token
async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // 🔍 DEBUG: Listar todos os cookies recebidos
    const allCookies = request.cookies.getAll();
    console.log('🍪 [LINK-EMAIL] Cookies recebidos:', allCookies.map(c => c.name).join(', '));

    // Buscar token do cookie ou header
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ [LINK-EMAIL] Token não encontrado');
      console.log('🔍 [LINK-EMAIL] Cookies disponíveis:', request.cookies.getAll().length);
      return null;
    }

    console.log('✅ [LINK-EMAIL] Token encontrado:', token.substring(0, 10) + '...');

    // Buscar token no banco
    const authToken = await prisma.authToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!authToken || authToken.expiresAt < new Date()) {
      console.log('❌ [LINK-EMAIL] Token inválido ou expirado');
      return null;
    }

    return authToken.userId;
  } catch (error) {
    console.error('❌ [LINK-EMAIL] Erro ao obter usuário:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 [LINK-EMAIL] === INÍCIO DA REQUISIÇÃO ===');

    // ✅ CORREÇÃO DE SEGURANÇA: Obter userId da SESSÃO (token), não do body
    console.log('🔗 [LINK-EMAIL] Obtendo userId da sessão...');
    const userId = await getUserFromRequest(request);
    console.log('🔗 [LINK-EMAIL] userId obtido:', userId);

    if (!userId) {
      console.error('❌ [LINK-EMAIL] Nenhum userId encontrado na sessão');
      return NextResponse.json(
        { error: 'Não autorizado. Faça login novamente.' },
        { status: 401 }
      );
    }

    // ✅ NOVA LÓGICA: Aceitar APENAS email e code (outros campos já foram salvos antes)
    console.log('🔗 [LINK-EMAIL] Parseando body...');
    const { email, code } = await request.json();

    console.log('🔗 [LINK-EMAIL] Iniciando vinculação de email');
    console.log('🔗 [LINK-EMAIL] userId (da sessão):', userId);
    console.log('🔗 [LINK-EMAIL] email:', email);
    console.log('🔗 [LINK-EMAIL] code:', code?.substring(0, 3) + '***');

    // Validação de campos obrigatórios
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      );
    }

    // ETAPA 1: Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // ETAPA 2: Verificar que o usuário tem carteira vinculada (implica wallet user)
    if (!user.publicKey) {
      return NextResponse.json(
        { error: 'Esta função é apenas para usuários com carteira vinculada' },
        { status: 403 }
      );
    }

    // ETAPA 3: Verificar o código de verificação
    const verificationRecord = await prisma.verificationCode.findFirst({
      where: {
        email: email,
        code: code,
        expiresAt: {
          gt: new Date() // Não expirado
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!verificationRecord) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 403 }
      );
    }

    // ETAPA 4: Verificar se o email já está em uso por outra conta
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: 'Este email já está vinculado a outra conta' },
        { status: 409 }
      );
    }

    // ETAPA 5: Deletar código (já foi usado)
    await prisma.verificationCode.delete({
      where: { id: verificationRecord.id }
    });

    // ✅ NOVA LÓGICA: ETAPA 6: Vincular APENAS o email
    // Os outros dados do perfil já foram salvos antes pelo updateUserProfile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: email
        // Nota: A presença do email já indica que foi verificado (só vinculamos após verificação do código)
      }
    });

    console.log('✅ [LINK-EMAIL] Email vinculado com sucesso');
    console.log('✅ [LINK-EMAIL] Email atualizado:', email);

    // Retornar sucesso com o usuário atualizado
    return NextResponse.json({
      success: true,
      message: 'Email vinculado com sucesso!',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('❌ [LINK-EMAIL] === ERRO CAPTURADO ===');
    console.error('❌ [LINK-EMAIL] Tipo:', error?.constructor?.name);
    console.error('❌ [LINK-EMAIL] Mensagem:', error?.message);
    console.error('❌ [LINK-EMAIL] Stack:', error?.stack);
    console.error('❌ [LINK-EMAIL] Erro completo:', JSON.stringify(error, null, 2));

    return NextResponse.json(
      {
        error: 'Erro interno ao vincular email',
        details: error?.message || 'Erro desconhecido',
        type: error?.constructor?.name
      },
      { status: 500 }
    );
  }
}
