import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, publicKey } = await request.json();
    
    console.log('🔗 [CONNECT-WALLET] Tentando conectar');
    console.log('🔗 [CONNECT-WALLET] Email:', email);
    console.log('🔗 [CONNECT-WALLET] PublicKey:', publicKey);
    
    if (!publicKey) {
      return NextResponse.json({ 
        error: 'PublicKey é obrigatório' 
      }, { status: 400 });
    }
    
    // Se email não foi fornecido, é login direto com carteira
    if (!email) {
      console.log('🔗 [CONNECT-WALLET] Login direto com carteira');
      
      // Verificar se carteira já está conectada
      const existingUser = await prisma.user.findUnique({
        where: { publicKey }
      });
      
      if (existingUser) {
        console.log('✅ [CONNECT-WALLET] Carteira já conectada:', existingUser.email);
        return NextResponse.json({ 
          success: true, 
          user: {
            id: existingUser.id,
            email: existingUser.email,
            publicKey: existingUser.publicKey
          }
        });
      }
      
      // Carteira não conectada - permitir login direto
      return NextResponse.json({ 
        success: true, 
        user: null,
        message: 'Carteira não conectada - pode fazer login direto'
      });
    }
    
    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.error('❌ [CONNECT-WALLET] Usuário não encontrado');
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }
    
    console.log('🔍 [CONNECT-WALLET] Usuário encontrado:', {
      id: user.id,
      email: user.email,
      currentPublicKey: user.publicKey
    });
    
    // CRÍTICO: Verificar se carteira já está em uso por OUTRO usuário
    const existingWallet = await prisma.user.findFirst({
      where: {
        publicKey: publicKey,
        id: { not: user.id }
      }
    });
    
    if (existingWallet) {
      console.error('❌ [CONNECT-WALLET] Carteira já em uso por:', existingWallet.email);
      return NextResponse.json({
        error: 'Esta carteira já está conectada a outra conta.',
        hint: `Faça login com: ${existingWallet.email.substring(0, 5)}***`
      }, { status: 409 });
    }
    
    console.log('✅ [CONNECT-WALLET] Carteira disponível, atualizando usuário...');
    
    // Atualizar carteira do usuário
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { publicKey }
    });
    
    console.log('✅ [CONNECT-WALLET] Sucesso:', {
      userId: updated.id,
      email: updated.email,
      publicKey: updated.publicKey
    });
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: updated.id,
        email: updated.email,
        publicKey: updated.publicKey
      }
    });
    
  } catch (error: any) {
    console.error('❌ [CONNECT-WALLET] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao conectar carteira',
      details: error.message 
    }, { status: 500 });
  }
}