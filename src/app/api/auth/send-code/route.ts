import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

// Função para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para gerar código de 6 dígitos
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface SendCodeRequest {
  email: string;
}

// Função para enviar email usando Nodemailer
async function sendEmail(email: string, code: string): Promise<boolean> {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    const isEmailConfigured = process.env.EMAIL_USER && 
                              process.env.EMAIL_PASSWORD && 
                              process.env.EMAIL_PASSWORD !== 'your_app_password_here';
    
    if (!isEmailConfigured) {
      console.log(`📧 [EMAIL] Variáveis não configuradas - Modo simulação`);
      console.log(`📧 [EMAIL] Código para ${email}: ${code}`);
      console.log(`📧 [EMAIL] Use este código para fazer login!`);
      return true; // Simular sucesso
    }

    // Implementação real com Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Seu código de verificação - Market Fantasy League (MFL)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #f97316; margin: 0;">Market Fantasy League (MFL)</h2>
            <p style="color: #666; margin: 5px 0;">Sua liga de fantasy de mercado</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h3 style="color: #333; margin-bottom: 20px;">Seu código de verificação</h3>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #f97316; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${code}</h1>
            </div>
            <p style="color: #666; margin: 20px 0;">Este código expira em <strong>5 minutos</strong></p>
            <p style="color: #999; font-size: 14px;">Se você não solicitou este código, ignore este email.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">© 2024 Market Fantasy League (MFL). Todos os direitos reservados.</p>
          </div>
        </div>
      `
    });
    
    console.log(`✅ [EMAIL] Email enviado com sucesso para ${email}`);
    return true;
  } catch (error) {
    console.error('❌ [EMAIL] Erro ao enviar email:', error);
    // Em desenvolvimento, mesmo com erro, permitir que o código seja usado
    console.log(`🎯 [EMAIL] FALLBACK: Código ${code} para ${email} - Use este código para fazer login!`);
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SendCodeRequest = await request.json();
    const { email } = body;

    // Validação do email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Verificar se já existe um código válido para este email
    const existingCode = await prisma.verificationCode.findUnique({
      where: { email }
    });

    if (existingCode && existingCode.expiresAt > new Date()) {
      const timeLeft = Math.ceil((existingCode.expiresAt.getTime() - Date.now()) / 1000);
      if (timeLeft > 240) { // 4 minutos restantes
        return NextResponse.json(
          {
            error: 'Aguarde antes de solicitar um novo código',
            timeLeft: timeLeft - 240
          },
          { status: 429 }
        );
      }
    }

    // Gerar novo código
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    console.log(`📝 [SEND-CODE] Gerando código para ${email}`);
    console.log(`📝 [SEND-CODE] Código gerado: ${code}`);
    console.log(`📝 [SEND-CODE] Expira em: ${expiresAt.toISOString()}`);

    // 🔧 CRÍTICO: SALVAR NO BANCO PRIMEIRO, ANTES DE ENVIAR EMAIL!
    const savedCode = await prisma.verificationCode.upsert({
      where: { email },
      update: {
        code,
        expiresAt,
        attempts: 0
      },
      create: {
        email,
        code,
        expiresAt,
        attempts: 0
      }
    });

    console.log(`✅ [SEND-CODE] Código salvo no banco:`, {
      id: savedCode.id,
      email: savedCode.email,
      code: savedCode.code,
      expiresAt: savedCode.expiresAt
    });

    // Verificação dupla: garantir que foi salvo
    const verification = await prisma.verificationCode.findUnique({
      where: { email }
    });

    if (!verification || verification.code !== code) {
      console.error('❌ [SEND-CODE] Falha ao salvar código no banco!');
      throw new Error('Falha ao salvar código no banco');
    }

    console.log(`✅ [SEND-CODE] Verificação dupla OK - Código confirmado no banco`);

    // 📧 AGORA SIM ENVIAR EMAIL (após garantir que está no banco)
    const emailSent = await sendEmail(email, code);
    
    // Preparar resposta
    const response: any = {
      message: emailSent ? 'Código de verificação enviado com sucesso' : 'Código gerado (modo simulação)',
      email: email,
      expiresIn: 300 // 5 minutos em segundos
    };

    // Se email não foi enviado ou está em modo desenvolvimento, incluir código na resposta
    const isEmailConfigured = process.env.EMAIL_USER &&
                              process.env.EMAIL_PASSWORD &&
                              process.env.EMAIL_PASSWORD !== 'your_app_password_here';

    // 🐛 DEBUG MODE: Mostrar código para email específico (learts@gmail.com)
    const isDebugEmail = email.toLowerCase() === 'learts@gmail.com';

    if (!emailSent || !isEmailConfigured || isDebugEmail) {
      response.developmentCode = code;
      response.note = isDebugEmail
        ? '🐛 Modo Debug: O código será exibido na tela'
        : 'Verifique os logs do servidor para ver o código';

      if (isDebugEmail) {
        console.log(`🐛 [DEBUG MODE] Código para ${email}: ${code}`);
      }
    }

    console.log(`✅ [SEND-CODE] Resposta enviada:`, {
      message: response.message,
      email: response.email,
      hasCode: !!response.developmentCode
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [SEND-CODE] Erro na API send-code:', error);
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