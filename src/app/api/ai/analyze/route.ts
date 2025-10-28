import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { prompt, type } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a API key está configurada
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY não configurada');
      return NextResponse.json(
        { error: 'API Key não configurada' },
        { status: 500 }
      );
    }

    console.log(`🤖 [GEMINI AI] Processando análise do tipo: ${type}`);

    // Usar o modelo Gemini Pro
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Gerar conteúdo
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(`✅ [GEMINI AI] Análise gerada com sucesso (${text.length} caracteres)`);

    return NextResponse.json({
      analysis: text,
      type
    });

  } catch (error: any) {
    console.error('❌ [GEMINI AI] Erro completo:', error);
    console.error('❌ [GEMINI AI] Error message:', error.message);
    console.error('❌ [GEMINI AI] Error stack:', error.stack);

    // Tratamento de erros específicos
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      return NextResponse.json(
        { error: 'API Key inválida ou não configurada. Configure GEMINI_API_KEY no arquivo .env' },
        { status: 401 }
      );
    }

    if (error.message?.includes('quota')) {
      return NextResponse.json(
        { error: 'Limite de uso da API atingido. Tente novamente mais tarde.' },
        { status: 429 }
      );
    }

    // Retornar mensagem de erro mais detalhada
    return NextResponse.json(
      {
        error: 'Erro ao processar análise. Tente novamente.',
        details: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
