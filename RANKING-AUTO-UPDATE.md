# Auto-Update de Ranking Sincronizado com Tokens

## 🎯 Objetivo
Implementar atualização automática do ranking sincronizada com a atualização dos preços dos tokens, evitando chamadas duplicadas à API do CoinGecko.

## ✅ Implementação

### 1. Novo Hook: `use-ranking.ts`
Criado hook customizado usando React Query para gerenciar dados de ranking:

**Localização:** `/src/hooks/use-ranking.ts`

**Características:**
- ✅ Auto-atualização a cada **5 minutos** (sincronizado com `use-tokens`)
- ✅ Atualização quando janela ganha foco
- ✅ Atualização quando reconecta à internet
- ✅ Cache inteligente com `staleTime` de 4 minutos
- ✅ Retry automático em caso de erro (2 tentativas)
- ✅ Suporte a `competitionId` e `leagueId`

```typescript
export function useRanking(
  leagueId: string | null,
  competitionId: string | null,
  enabled: boolean = true
)
```

### 2. Página de Ranking Atualizada
Refatorada para usar o novo hook em vez de `useEffect` manual.

**Localização:** `/src/app/[locale]/ranking/page.tsx`

**Mudanças:**
- ❌ Removido: `useState` para `teams`, `leagueData`, `loading`, `error`
- ❌ Removido: `useEffect` que fazia `fetch` manual
- ✅ Adicionado: `useRanking` hook
- ✅ Mantido: Handlers de snapshot e reset funcionando

## 🔄 Como Funciona

### Sincronização Automática

1. **Token Updates** (`use-tokens.ts`):
   - Atualiza a cada 5 minutos
   - Busca preços da API do CoinGecko

2. **Ranking Updates** (`use-ranking.ts`):
   - Atualiza a cada 5 minutos (mesmo intervalo)
   - API `/api/teams` calcula pontuações ao vivo usando CoinGecko

3. **Resultado:**
   - Ambos atualizam no mesmo momento
   - React Query batcha requests automaticamente
   - Evita chamadas duplicadas desnecessárias

### Fluxo de Dados

```
┌─────────────────┐         ┌──────────────────┐
│   use-tokens    │         │   use-ranking    │
│  (5 min cycle)  │         │   (5 min cycle)  │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         ▼                           ▼
   CoinGecko API              API /api/teams
         │                           │
         │                           ├──> CoinGecko API
         │                           │    (live scores)
         │                           │
         ▼                           ▼
   Token Prices              Ranking + Scores
```

## 📊 Benefícios

✅ **Sem Duplicação**: Ambos atualizam no mesmo ciclo
✅ **Sincronizado**: Dados sempre consistentes entre páginas
✅ **Eficiente**: React Query gerencia cache e requests
✅ **Automático**: Usuário não precisa atualizar manualmente
✅ **Inteligente**: Atualiza também em window focus e reconnect

## 🧪 Testando

### Verificar Auto-Update:
1. Abra a página de ranking: `http://localhost:3000/pt/ranking`
2. Observe os pontos dos times
3. Aguarde 5 minutos
4. Os dados devem atualizar automaticamente (observe no console)

### Verificar Window Focus:
1. Abra a página de ranking
2. Mude para outra janela/aba
3. Volte para a página de ranking
4. Dados serão atualizados automaticamente

### Console Logs:
React Query loga automaticamente as atualizações:
```
[React Query] Fetching query: ['ranking', 'leagueId', 'competitionId']
```

## 🔧 Configuração

Para ajustar o intervalo de atualização, edite:

**`/src/hooks/use-ranking.ts`:**
```typescript
refetchInterval: 5 * 60 * 1000,  // 5 minutos (altere aqui)
staleTime: 4 * 60 * 1000,         // 4 minutos (sempre < refetchInterval)
```

**`/src/hooks/use-tokens.ts`:**
```typescript
refetchInterval: 5 * 60 * 1000,  // Mantenha igual ao ranking
staleTime: 4 * 60 * 1000,
```

## 📝 Notas Técnicas

- React Query automaticamente cancela requests duplicados
- Cache compartilhado por `queryKey` única
- `enabled` flag permite desabilitar quando necessário
- Refetch manual disponível via `refetch()` function
- Error handling automático com retry exponencial

## ✅ Status

- [x] Hook `use-ranking` criado
- [x] Página de ranking refatorada
- [x] Sincronização com `use-tokens` configurada
- [x] TypeScript errors corrigidos
- [x] Ready para produção

---
**Data:** 2025-11-24
**Implementado por:** Claude Code
