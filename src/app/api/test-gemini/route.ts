import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json({
        error: 'GEMINI_API_KEY não configurada ou ainda com valor placeholder',
        apiKeyLength: apiKey?.length || 0,
        apiKeyPreview: apiKey?.substring(0, 10) + '...'
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent('Diga apenas "OK" se você está funcionando');
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      message: 'Gemini AI está funcionando!',
      response: text,
      apiKeyLength: apiKey.length,
      apiKeyPreview: apiKey.substring(0, 10) + '...'
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Erro ao testar Gemini AI',
      details: error.message,
      stack: error.stack,
      apiKeyConfigured: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0
    }, { status: 500 });
  }
}
