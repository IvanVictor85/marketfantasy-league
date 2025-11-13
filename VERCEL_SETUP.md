# Configuração do Vercel para CryptoFantasy League

## Problema Identificado

A funcionalidade de criação de mascote não funciona quando o projeto é implantado no Vercel devido à falta de configuração das variáveis de ambiente necessárias.

## Variáveis de Ambiente Necessárias

Para que a geração de mascotes funcione corretamente no Vercel, você precisa configurar as seguintes variáveis de ambiente:

### Obrigatórias para Geração de Mascotes:
- `GEMINI_API_KEY` - Chave da API do Google Gemini para geração de imagens
- `AI_IMAGE_PROVIDER` - Definir como "nano-banana" (padrão atual)

### Outras Variáveis Importantes:
- `NEXTAUTH_SECRET` - Chave secreta para autenticação
- `NEXTAUTH_URL` - URL do seu projeto no Vercel (ex: https://seu-projeto.vercel.app)
- `DATABASE_URL` - URL do banco de dados (se usando banco externo)

## Como Configurar no Vercel

### 1. Via Dashboard do Vercel:
1. Acesse [vercel.com](https://vercel.com) e faça login
2. Vá para o seu projeto
3. Clique em "Settings" → "Environment Variables"
4. Adicione cada variável:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `[SUA_CHAVE_GEMINI_AQUI]`
   - **Environments**: Production, Preview, Development
5. Repita para as outras variáveis necessárias

### 2. Via CLI do Vercel:
```bash
# Configurar GEMINI_API_KEY
vercel env add GEMINI_API_KEY

# Configurar AI_IMAGE_PROVIDER
vercel env add AI_IMAGE_PROVIDER

# Configurar NEXTAUTH_SECRET
vercel env add NEXTAUTH_SECRET

# Configurar NEXTAUTH_URL
vercel env add NEXTAUTH_URL
```

## Valores Recomendados

```env
GEMINI_API_KEY=[SUA_CHAVE_GEMINI_AQUI]
AI_IMAGE_PROVIDER=nano-banana
NEXTAUTH_SECRET=[GERAR_SEGREDO_ALEATORIO]
NEXTAUTH_URL=https://seu-projeto.vercel.app
```

⚠️ **IMPORTANTE**: Nunca commite valores reais de API keys no repositório!

## Logs de Debug

O código foi atualizado com logs detalhados para ajudar a identificar problemas. Após configurar as variáveis, você pode verificar os logs no Vercel:

1. Vá para o seu projeto no Vercel
2. Clique em "Functions" → "View Function Logs"
3. Procure por logs que começam com "=== DEBUG MASCOT GENERATION ==="

## Redeploy Necessário

Após configurar as variáveis de ambiente, você precisa fazer um novo deploy:

```bash
# Via CLI
vercel --prod

# Ou via Dashboard
# Vá para "Deployments" e clique em "Redeploy"
```

## Verificação

Para verificar se tudo está funcionando:

1. Acesse a página de perfil do seu projeto no Vercel
2. Clique em "Personalizar Mascote"
3. Preencha o formulário e clique em "Gerar Mascote"
4. Verifique os logs se houver problemas

## Troubleshooting

### Erro: "Chave da API do Gemini não configurada"
- Verifique se `GEMINI_API_KEY` está configurada no Vercel
- Certifique-se de que a variável está disponível para o ambiente correto (Production/Preview)

### Erro: "Quota exceeded"
- A API do Gemini tem limites de uso
- O sistema automaticamente usará imagens de fallback neste caso

### Logs não aparecem
- Verifique se você está olhando os logs da função correta (`/api/generate-mascot`)
- Aguarde alguns minutos após o deploy para os logs aparecerem