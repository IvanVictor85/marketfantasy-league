# Sistema de Validação de Tokens

## Visão Geral

O sistema de validação de tokens garante que apenas tokens do top 100 do mercado (baseado na API CoinGecko) possam ser usados na formação de times.

## Como Funciona

### 1. Lista de Tokens Válidos
- Localizada em: `src/lib/valid-tokens.ts`
- Contém todos os símbolos de tokens válidos
- É gerada automaticamente baseada na API `/api/tokens`

### 2. Validação
- Função `isValidToken(symbol)`: verifica se um token individual é válido
- Função `validateTokens(tokens[])`: valida uma lista de tokens
- Retorna tokens inválidos encontrados

### 3. API de Tokens
- Endpoint: `/api/tokens`
- Busca os top 100 tokens da CoinGecko
- Dados são cacheados para performance

## Atualizando a Lista de Tokens

### Automático
```bash
npm run update-tokens
```

### Manual
```bash
npx tsx scripts/update-valid-tokens.ts
```

### O que o script faz:
1. Busca tokens da API `/api/tokens`
2. Extrai os símbolos
3. Gera novo arquivo `valid-tokens.ts`
4. Cria backup do arquivo anterior

## Tratamento de Erros

### Frontend
- Mensagens claras sobre tokens inválidos
- Sugestão para usar o Token Market
- Indicação que tokens devem estar no top 100

### Backend
- Validação antes de salvar time
- Retorno de lista de tokens inválidos
- Status HTTP 400 para tokens inválidos

## Critérios de Validação

Um token é considerado válido se:
- Está no top 100 de capitalização de mercado (CoinGecko)
- Tem dados de preço disponíveis
- Está ativo no mercado

## Manutenção

### Quando atualizar:
- Novos tokens entram no top 100
- Tokens saem do top 100
- Mudanças na API CoinGecko

### Frequência recomendada:
- Semanalmente para produção
- Conforme necessário para desenvolvimento

## Arquivos Relacionados

- `src/lib/valid-tokens.ts` - Lista de tokens válidos
- `scripts/update-valid-tokens.ts` - Script de atualização
- `src/app/api/tokens/route.ts` - API de tokens
- `src/app/api/team/route.ts` - Validação no salvamento
- `src/app/[locale]/teams/teams-content.tsx` - Interface de erro

## Exemplo de Uso

```typescript
import { isValidToken, validateTokens } from '@/lib/valid-tokens';

// Validar token individual
const isValid = isValidToken('BTC'); // true

// Validar lista de tokens
const result = validateTokens(['BTC', 'ETH', 'INVALID']);
// { valid: false, invalidTokens: ['INVALID'] }
```