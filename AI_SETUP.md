# Configuração de IA para Geração de Mascotes

Este projeto suporta múltiplos provedores de IA para geração de imagens de mascotes esportivos.

## Provedores Suportados

### 1. Nano Banana (Gemini 2.5 Flash Image) - RECOMENDADO
- **Modelo**: Gemini 2.5 Flash Image
- **Qualidade**: Excelente
- **Custo**: Baixo
- **Velocidade**: Muito rápida
- **Configuração**: Requer chave da API Google Gemini

### 2. OpenAI DALL-E 3
- **Modelo**: DALL-E 3
- **Qualidade**: Excelente
- **Custo**: Médio-Alto
- **Configuração**: Requer chave da API OpenAI

### 3. Hugging Face Stable Diffusion
- **Modelo**: Stable Diffusion XL Base 1.0
- **Qualidade**: Boa
- **Custo**: Baixo (gratuito com limitações)
- **Configuração**: Requer chave da API Hugging Face

## Opções de Configuração

### Nano Banana - Gemini 2.5 Flash Image (RECOMENDADO)

1. Obtenha uma chave de API em: https://aistudio.google.com/app/apikey
2. Configure no arquivo `.env.local`:
   ```
   GEMINI_API_KEY=sua_chave_aqui
   AI_IMAGE_PROVIDER=nano-banana
   ```

**Vantagens:**
- Geração muito rápida
- Custo baixo
- Qualidade excelente
- Otimizado para imagens de mascotes
- Suporte nativo a prompts em português

### OpenAI DALL-E (Pago, Alta Qualidade)

1. Obtenha uma chave de API em: https://platform.openai.com/api-keys
2. Adicione no arquivo `.env.local`:
```
OPENAI_API_KEY=sua_chave_aqui
AI_IMAGE_PROVIDER=openai
```

**Custos:** ~$0.040 por imagem (DALL-E 3, 1024x1024)

### 2. Hugging Face (Gratuito com Limitações)

1. Crie uma conta em: https://huggingface.co/
2. Obtenha um token em: https://huggingface.co/settings/tokens
3. Adicione no arquivo `.env.local`:
```
HUGGINGFACE_API_KEY=sua_chave_aqui
AI_IMAGE_PROVIDER=huggingface
```

**Limitações:** Rate limits, pode ter fila de espera

### 3. Modo Fallback (Padrão)

Se nenhuma chave for configurada, o sistema usará imagens de exemplo do Unsplash.

## Como Testar

1. Configure uma das opções acima
2. Reinicie o servidor de desenvolvimento: `npm run dev`
3. Acesse a página de perfil e teste a geração de mascotes

## Prompts Otimizados

O sistema automaticamente otimiza os prompts para gerar mascotes esportivos:
- Estilo cartoon
- Cores vibrantes
- Aparência amigável
- Adequado para logo de time

## Troubleshooting

- **Erro de API Key:** Verifique se a chave está correta no `.env.local`
- **Rate Limit:** Aguarde alguns minutos e tente novamente
- **Timeout:** A geração pode levar até 30 segundos