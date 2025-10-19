# Token Storage Format - Padrão de Armazenamento

## 📋 Resumo

A coluna `tokens` na tabela `Team` armazena **APENAS símbolos** dos tokens, em formato JSON array de strings.

## ✅ Formato Correto

```json
["BTC", "ETH", "SOL", "ADA", "LINK", "AVAX", "MATIC", "DOGE", "BNB", "UNI"]
```

### Características:
- Array de strings
- Sempre 10 elementos
- Apenas símbolos (uppercase)
- Sem metadados adicionais

## ❌ Formatos Incorretos (Antigos)

```json
// ❌ Array de objetos
[
  {"symbol": "BTC", "name": "Bitcoin", "logoUrl": "..."},
  {"symbol": "ETH", "name": "Ethereum", "logoUrl": "..."}
]

// ❌ Objeto com posições
{
  "CAPTAIN": {"symbol": "BTC", "startPrice": 50000},
  "WILDCARD": {"symbol": "ETH", "startPrice": 3000}
}
```

## 🎯 Vantagens do Formato Atual

1. **Simplicidade**: Apenas o essencial
2. **Sem Duplicação**: Dados como nome e logo vêm do CoinGecko (sempre atualizados)
3. **Menor Tamanho**: Reduz espaço no banco
4. **Fácil Validação**: Simples verificar se são strings válidas

## 📊 Schema Prisma

```prisma
model Team {
  // ...
  tokens String // JSON array of token symbols only: ["BTC", "ETH", "SOL", ...]
  // ...
}
```

## 🔧 Salvando Times

### API Route (src/app/api/team/route.ts)

```typescript
// ✅ CORRETO
const tokens = ["BTC", "ETH", "SOL", ...]; // Array de strings

await prisma.team.create({
  data: {
    tokens: JSON.stringify(tokens), // Salva array de strings
    // ...
  }
});
```

## 📖 Lendo Times

### Padrão Recomendado

```typescript
// 1. Ler do banco
const team = await prisma.team.findUnique({ where: { id } });
const tokenSymbols = JSON.parse(team.tokens); // ["BTC", "ETH", ...]

// 2. Buscar detalhes do CoinGecko
const { tokens: marketData } = await getCachedMarketTokens();

// 3. Enriquecer com dados do mercado
const tokenDetails = tokenSymbols.map(symbol => {
  const data = marketData.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());

  return {
    symbol,
    name: data?.name || symbol,
    logoUrl: data?.image || null,
    currentPrice: data?.current_price || 0,
    priceChange24h: data?.price_change_percentage_24h || 0,
  };
});
```

### Exemplos no Código

**✅ manager.ts (linhas 85, 164, 275)**
```typescript
const tokens = JSON.parse(team.tokens) as string[];
tokens.forEach(token => allTokens.add(token));
```

**✅ route.ts (linha 254)**
```typescript
let teamTokens: string[] = [];
try {
  teamTokens = JSON.parse(team.tokens);
} catch (error) {
  console.error('Error parsing team tokens:', error);
  teamTokens = [];
}
```

## 🛠️ Scripts de Manutenção

### Normalizar Times Existentes
```bash
npm run normalize-tokens
```

Converte todos os times do formato antigo (objetos) para o novo formato (strings).

### Validar Todos os Times
```bash
npm run validate-tokens
```

Verifica se todos os times estão no formato correto.

## 🚨 Migrations

Se você tem times no formato antigo, execute:

```bash
# 1. Normalizar dados existentes
npm run normalize-tokens

# 2. Validar que tudo está correto
npm run validate-tokens
```

## 📝 Checklist de Integração

Ao trabalhar com tokens:

- [ ] Salvar: `JSON.stringify(["BTC", "ETH", ...])`
- [ ] Ler: `JSON.parse(team.tokens)` retorna `string[]`
- [ ] Enriquecer: Buscar detalhes no CoinGecko
- [ ] Validar: Verificar que são 10 strings

## 🔍 Validação

```typescript
function validateTokenFormat(tokens: any): boolean {
  return (
    Array.isArray(tokens) &&
    tokens.length === 10 &&
    tokens.every(t => typeof t === 'string')
  );
}
```

## 📚 Referências

- **Schema**: `prisma/schema.prisma` (linha 66)
- **API**: `src/app/api/team/route.ts`
- **Manager**: `src/lib/competition/manager.ts`
- **Script de normalização**: `scripts/normalize-team-tokens.ts`
- **Script de validação**: `scripts/validate-all-teams.ts`

---

**Última atualização**: 2025-10-18
**Status**: ✅ Implementado e testado
