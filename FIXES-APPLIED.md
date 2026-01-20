# Correções Aplicadas - Check-Entry e Tokens

## Data: 2025-11-17

### 🔧 Problema Identificado

O botão "Entrar na Rodada" continuava aparecendo mesmo com o usuário já tendo LeagueEntry confirmada no banco. Causa raiz: **API `/api/league/check-entry` nunca era chamada**.

### 🐛 Causa Raiz

A API `/api/competition/status` retorna um **objeto flat**:
```json
{
  "competitionId": "cmi1pvmrn0001q9qvbjejtuly",
  "leagueId": "cmh3qcrw80000cjvdrwtvt65i",
  "status": "ACTIVE",
  "startDate": "2025-01-15T00:00:00.000Z",
  "endDate": "2025-01-22T00:00:00.000Z"
}
```

Mas o hook `useCompetitionStatus` esperava um **objeto nested**:
```typescript
result.competition.id // ❌ undefined
```

Resultado: `competitionData` era sempre `null`, bloqueando a guard clause em teams-content.tsx:218.

### ✅ Correções Aplicadas

#### 1. Regenerado Prisma Client
```bash
npx prisma generate
```
Limpa cache e carrega os 37 tokens já corrigidos no banco.

#### 2. Corrigido `src/hooks/useCompetitionStatus.ts`

**Antes:**
```typescript
setData({
  competition: result.competition ? {
    ...result.competition,
    startTime: new Date(result.competition.startTime),
    endTime: new Date(result.competition.endTime),
  } : null,
```

**Depois:**
```typescript
setData({
  competition: result.competitionId ? {
    id: result.competitionId,
    competitionId: result.competitionId, // Alias para compatibilidade
    leagueId: result.leagueId,
    startTime: new Date(result.startDate),
    endTime: new Date(result.endDate),
    status: result.status?.toLowerCase() || 'pending',
    prizePool: result.prizePool || 0,
    distributed: result.distributed || false,
  } : null,
```

#### 3. Adicionado XMR ao Mapeamento
Em `src/lib/services/coingecko.service.ts`:
```typescript
'XMR': 'monero',
```

#### 4. Corrigido Mapeamento de competitionId
Em `src/app/[locale]/teams/teams-content.tsx`:
```typescript
const competitionSlug = selectedLeagueId === 'cmh3qcrw80000cjvdrwtvt65i'
  ? 'main-league'
  : selectedLeagueId;
```

### 🎯 Resultado Esperado

Após reiniciar o servidor dev (`npm run dev`):

1. ✅ **check-entry API será chamada** - Logs devem mostrar:
   ```
   POST /api/league/check-entry
   DEBUG checkPaymentAndLoadTeam: Verificando entrada na liga
   ```

2. ✅ **Botão "Entrar" desaparecerá** - Card mostrará status correto (já participando)

3. ✅ **37 tokens carregarão corretamente** - Com IDs: `bitcoin`, `ethereum`, etc. (não mais `cmi...`)

4. ✅ **Imagens dos tokens aparecerão** - URLs da API CoinGecko

### 📋 Tarefas Pendentes

1. **Corrigir 60 tokens restantes** - Adicionar símbolos faltantes ao `SYMBOL_TO_ID_MAP` e re-executar script de fix
2. **Investigar leagueId: null** - GET /api/team ainda recebe `leagueId: null` em alguns casos
3. **Testar fluxo completo** - Verificar que importar time principal funciona corretamente

### 🔍 Como Verificar

1. Reinicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000/pt/teams?league=cmh3qcrw80000cjvdrwtvt65i`
3. Verifique os logs do console (DevTools):
   - Deve aparecer `POST /api/league/check-entry`
   - Deve aparecer `✅ CoinGecko: XX token(s) encontrado(s)` com IDs corretos
4. Verifique o card da Liga Principal:
   - Botão "Entrar" deve desaparecer
   - Deve mostrar que você já está participando
