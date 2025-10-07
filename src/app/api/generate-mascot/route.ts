import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Interface para os dados do formulário de mascote
interface MascotFormData {
  character: string;
  uniformStyle: string;
  accessory?: string;
}

// Interface para a resposta da API
interface GeneratedMascot {
  id: string;
  imageUrl: string;
  prompt: string;
  character: string;
  uniformStyle: string;
  accessory?: string;
  createdAt: string;
}

// Função para criar prompt baseado nos dados do formulário
function createPromptFromFormData(data: MascotFormData): string {
  const { character, uniformStyle, accessory } = data;
  
  // Mapear cores do uniforme para fundos
  const backgroundColors = {
    'Vibrante Solana (Roxo & Verde)': 'fundo colorido com tons de roxo vibrante e verde brilhante, sem preto',
    'Clássico Bitcoin (Laranja & Preto)': 'fundo colorido com tons de laranja vibrante e dourado, sem preto',
    'Moderno Ethereum (Azul & Prata)': 'fundo colorido com tons de azul vibrante e prata brilhante, sem preto',
    'Energético Cardano (Azul & Branco)': 'fundo colorido com tons de azul vibrante e branco puro, sem preto',
    'Dinâmico Polygon (Roxo & Rosa)': 'fundo colorido com tons de roxo vibrante e rosa brilhante, sem preto',
    'Futurista Chainlink (Azul & Cinza)': 'fundo colorido com tons de azul vibrante e cinza claro, sem preto'
  };
  
  let prompt = `Mascote esportivo de ${character} vestindo uniforme ${uniformStyle}`;
  
  // Adicionar bola de futebol (soccer) por padrão - especificar claramente para evitar futebol americano
  prompt += ', com uma bola de futebol redonda (soccer ball), não futebol americano';
  
  if (accessory && accessory.trim()) {
    prompt += ` com ${accessory}`;
  }
  
  // Adicionar fundo colorido baseado no uniforme
  const background = backgroundColors[uniformStyle as keyof typeof backgroundColors] || 'fundo colorido vibrante';
  prompt += `, estilo cartoon, cores vibrantes, ${background}`;
  
  return prompt;
}

// Função para gerar imagem usando IA real
async function generateMascotImage(prompt: string): Promise<string> {
  const provider = process.env.AI_IMAGE_PROVIDER || 'nano-banana';
  
  try {
    if (provider === 'openai') {
      return await generateWithOpenAI(prompt);
    } else if (provider === 'huggingface') {
      return await generateWithHuggingFace(prompt);
    } else if (provider === 'nano-banana') {
      return await generateWithNanoBanana(prompt);
    } else {
      throw new Error(`Provedor de IA não suportado: ${provider}`);
    }
  } catch (error) {
    console.error('Erro na geração de imagem com IA:', error);
    
    // Verificar se é erro de quota e logar informação específica
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    if (errorMessage.includes('Quota exceeded') || errorMessage.includes('quota')) {
      console.log(`Quota excedida para o provedor ${provider}. Usando imagem de fallback.`);
    } else {
      console.log(`Erro no provedor ${provider}: ${errorMessage}. Usando imagem de fallback.`);
    }
    
    // Fallback para imagens de exemplo em caso de erro
    return getFallbackImage(prompt);
  }
}

// Geração com OpenAI DALL-E
async function generateWithOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `Create a sports mascot: ${prompt}. Style: cartoon, vibrant colors, friendly appearance, suitable for a sports team logo.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].url;
}

// Geração com Hugging Face (opção gratuita)
async function generateWithHuggingFace(prompt: string): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY não configurada');
  }

  // Usando o modelo Stable Diffusion
  const response = await fetch(
    'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `sports mascot, ${prompt}, cartoon style, vibrant colors, friendly, team logo, high quality, detailed`,
        parameters: {
          negative_prompt: 'blurry, low quality, dark, scary, realistic photo',
          num_inference_steps: 50,
          guidance_scale: 7.5,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  // A resposta é uma imagem em blob
  const imageBlob = await response.blob();
  
  // Converter blob para base64 para retornar como data URL
  const arrayBuffer = await imageBlob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:image/png;base64,${base64}`;
}

// Função para gerar imagem usando Nano Banana (Gemini 2.5 Flash Image)
async function generateWithNanoBanana(prompt: string): Promise<string> {
  console.log('=== NANO BANANA GENERATION ===');
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.log('ERROR: Gemini API key not configured');
    throw new Error('Chave da API do Gemini não configurada');
  }

  console.log('Initializing GoogleGenerativeAI...');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
  console.log('Model initialized successfully');

  try {
    console.log('Generating content with prompt:', prompt);
    const result = await model.generateContent([
      {
        text: `Gere uma imagem de mascote esportivo baseada nesta descrição: ${prompt}. 
               A imagem deve ser colorida, vibrante, amigável e adequada para representar um time esportivo.
               Estilo cartoon/ilustração digital, alta qualidade, fundo transparente ou simples.`
      }
    ]);
    console.log('Content generation completed');

    const response = await result.response;
    console.log('Response received, processing...');
    
    // O Gemini retorna a imagem como base64
    console.log('Response candidates:', response.candidates?.length || 0);
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      console.log('Candidate content exists:', !!candidate.content);
      console.log('Candidate parts:', candidate.content?.parts?.length || 0);
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          console.log('Part has inlineData:', !!part.inlineData);
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            console.log('Image generated successfully, mime type:', mimeType);
            return `data:${mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    }
    
    console.log('ERROR: No image was generated by Nano Banana');
    throw new Error('Nenhuma imagem foi gerada pelo Nano Banana');
  } catch (error) {
    console.error('=== NANO BANANA ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Erro desconhecido');
    console.error('Full error:', error);
    
    // Verificar se é erro de quota excedida
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    if (errorMessage.includes('Quota exceeded') || errorMessage.includes('quota')) {
      console.log('Quota do Nano Banana excedida, usando fallback automático...');
      return getFallbackImage(prompt);
    }
    
    console.log('Using fallback image due to error');
    throw new Error(`Erro na geração com Nano Banana: ${errorMessage}`);
  }
}

// Função de fallback para imagens de exemplo
function getFallbackImage(prompt: string): string {
  const sampleImages = [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=400&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop&crop=center'
  ];
  
  const randomIndex = Math.floor(Math.random() * sampleImages.length);
  return sampleImages[randomIndex];
}

// Função para gerar ID único
function generateId(): string {
  return `mascot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    // Log de debug para ambiente
    console.log('=== DEBUG MASCOT GENERATION ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('AI Provider:', process.env.AI_IMAGE_PROVIDER);
    console.log('Gemini API Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('Gemini API Key length:', process.env.GEMINI_API_KEY?.length || 0);
    
    // Parse do body da requisição
    const body: MascotFormData = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Validação dos dados obrigatórios
    if (!body.character || !body.uniformStyle) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json(
        { 
          error: 'Dados obrigatórios ausentes',
          message: 'Personagem principal e estilo do uniforme são obrigatórios'
        },
        { status: 400 }
      );
    }
    
    // Validação de tamanho dos campos
    if (body.character.length > 100 || body.uniformStyle.length > 100) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          message: 'Personagem e estilo do uniforme devem ter no máximo 100 caracteres'
        },
        { status: 400 }
      );
    }
    
    if (body.accessory && body.accessory.length > 100) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          message: 'Acessório deve ter no máximo 100 caracteres'
        },
        { status: 400 }
      );
    }
    
    // Criar prompt baseado nos dados
    const prompt = createPromptFromFormData(body);
    console.log('Generated prompt:', prompt);
    
    // Gerar imagem do mascote
    console.log('Starting image generation...');
    const imageUrl = await generateMascotImage(prompt);
    console.log('Image generation completed. URL length:', imageUrl?.length || 0);
    
    // Criar objeto de resposta
    const generatedMascot: GeneratedMascot = {
      id: generateId(),
      imageUrl,
      prompt,
      character: body.character,
      uniformStyle: body.uniformStyle,
      accessory: body.accessory,
      createdAt: new Date().toISOString()
    };
    
    // Retornar resposta de sucesso
    return NextResponse.json({
      success: true,
      data: generatedMascot,
      message: 'Mascote gerado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro na geração do mascote:', error);
    
    // Retornar erro interno do servidor
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro ao gerar o mascote. Tente novamente.'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se a API está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'API de geração de mascotes está funcionando',
    endpoint: '/api/generate-mascot',
    methods: ['POST'],
    version: '1.0.0'
  });
}