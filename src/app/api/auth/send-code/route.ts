import { NextRequest, NextResponse } from 'next/server';
import { 
  verificationCodes, 
  generateVerificationCode, 
  isValidEmail 
} from '@/lib/verification-storage';
import nodemailer from 'nodemailer';

interface SendCodeRequest {
  email: string;
}

// Função para enviar email usando Nodemailer
async function sendEmail(email: string, code: string): Promise<boolean> {
  try {
    // Para desenvolvimento, sempre log o código
    console.log(`📧 Código de verificação para ${email}: ${code}`);
    console.log(`🔗 Use este código na aplicação: ${code}`);
    
    // Verificar se as variáveis de ambiente estão configuradas corretamente
    const isEmailConfigured = process.env.EMAIL_USER && 
                              process.env.EMAIL_PASSWORD && 
                              process.env.EMAIL_PASSWORD !== 'your_app_password_here';
    
    if (!isEmailConfigured) {
      console.warn('⚠️ Variáveis de email não configuradas ou usando valores placeholder. Usando modo simulação.');
      console.log(`🎯 MODO DESENVOLVIMENTO: Código ${code} para ${email} - Use este código para fazer login!`);
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
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
    
    console.log(`✅ Email enviado com sucesso para ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    // Em desenvolvimento, mesmo com erro, permitir que o código seja usado
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      console.log(`🎯 FALLBACK DESENVOLVIMENTO: Código ${code} para ${email} - Use este código para fazer login!`);
      return true;
    }
    return false;
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
    const existingCode = verificationCodes.get(email);
    if (existingCode && existingCode.expiresAt > new Date()) {
      // Se ainda há um código válido, não enviar outro por 1 minuto
      const timeLeft = Math.ceil((existingCode.expiresAt.getTime() - Date.now()) / 1000);
      if (timeLeft > 240) { // 4 minutos restantes (código expira em 5 min)
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

    // Armazenar código
    verificationCodes.set(email, {
      email,
      code,
      expiresAt,
      attempts: 0
    });

    console.log(`💾 [SEND-CODE] Código armazenado com sucesso`);
    console.log(`💾 [SEND-CODE] Verificação imediata:`, verificationCodes.get(email));
    console.log(`💾 [SEND-CODE] Total de códigos armazenados:`, verificationCodes.size);

    // Pequeno delay para garantir que o código foi processado
    await new Promise(resolve => setTimeout(resolve, 100));

    // Enviar email
    const emailSent = await sendEmail(email, code);
    
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Erro ao enviar email. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Código de verificação enviado com sucesso',
      email: email,
      expiresIn: 300 // 5 minutos em segundos
    });

  } catch (error) {
    console.error('Erro na API send-code:', error);
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

// Função para limpar códigos expirados (executar periodicamente)
function cleanupExpiredCodes() {
  const now = new Date();
  for (const [email, codeData] of verificationCodes.entries()) {
    if (codeData.expiresAt < now) {
      verificationCodes.delete(email);
    }
  }
}