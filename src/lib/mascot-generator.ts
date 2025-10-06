import { MascotFormData } from '@/components/mascot/mascot-customization-form';

// Simulação de URLs de imagens geradas (em produção, seria uma API real)
const SAMPLE_MASCOT_IMAGES = [
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop&crop=face',
];

export interface GeneratedMascot {
  imageUrl: string;
  prompt: string;
  timestamp: number;
  formData: MascotFormData;
}

/**
 * Simula a geração de um mascote personalizado usando IA
 * Em produção, isso seria uma chamada para uma API real (OpenAI DALL-E, Midjourney, etc.)
 */
export async function generateMascotImage(formData: MascotFormData): Promise<GeneratedMascot> {
  // Simula tempo de processamento da IA (2-4 segundos)
  const processingTime = Math.random() * 2000 + 2000;
  
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  // Gera um prompt baseado nos dados do formulário
  const prompt = createPromptFromFormData(formData);
  
  // Seleciona uma imagem aleatória (em produção, seria a imagem gerada pela IA)
  const randomIndex = Math.floor(Math.random() * SAMPLE_MASCOT_IMAGES.length);
  const imageUrl = SAMPLE_MASCOT_IMAGES[randomIndex];
  
  return {
    imageUrl,
    prompt,
    timestamp: Date.now(),
    formData: { ...formData }
  };
}

/**
 * Cria um prompt detalhado baseado nos dados do formulário
 */
function createPromptFromFormData(formData: MascotFormData): string {
  const { character, uniformStyle, accessory } = formData;
  
  // Mapeia estilos de uniforme para descrições de cores
  const uniformDescriptions: Record<string, string> = {
    'classic-cfl': 'wearing an orange and purple sports uniform',
    'vibrant-solana': 'wearing a vibrant purple and green sports uniform',
    'elegant-ethereum': 'wearing an elegant black and purple sports uniform',
    'golden-bitcoin': 'wearing a golden and black sports uniform',
    'neon-polygon': 'wearing a neon purple and pink sports uniform',
    'cosmic-cardano': 'wearing a cosmic blue and silver sports uniform',
  };
  
  let prompt = `A cute and friendly ${character} mascot character`;
  
  // Adiciona descrição do uniforme
  if (uniformDescriptions[uniformStyle]) {
    prompt += ` ${uniformDescriptions[uniformStyle]}`;
  }
  
  // Adiciona acessório se especificado
  if (accessory.trim()) {
    prompt += ` with ${accessory}`;
  }
  
  // Adiciona estilo geral
  prompt += ', digital art style, mascot design, cheerful expression, sports theme, high quality, detailed';
  
  return prompt;
}

/**
 * Valida se uma URL de imagem é válida
 */
export function isValidImageUrl(url: string): boolean {
  try {
    new URL(url);
    return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
  } catch {
    return false;
  }
}

/**
 * Gera um nome único para o arquivo do mascote
 */
export function generateMascotFileName(formData: MascotFormData): string {
  const timestamp = Date.now();
  const characterSlug = formData.character.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `mascot-${characterSlug}-${timestamp}`;
}

/**
 * Simula o salvamento do mascote (em produção, seria uma API call)
 */
export async function saveMascotToProfile(
  userId: string, 
  generatedMascot: GeneratedMascot
): Promise<boolean> {
  // Simula tempo de salvamento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Em produção, aqui seria feita a chamada para a API
  console.log('Salvando mascote para o usuário:', userId, generatedMascot);
  
  // Simula sucesso (em produção, poderia falhar)
  return Math.random() > 0.1; // 90% de chance de sucesso
}