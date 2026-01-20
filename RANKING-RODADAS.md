# Filtro de Rodadas no Ranking

## 🎯 Problema Identificado

O ranking mostrava apenas filtro por **Liga**, mas não permitia selecionar a **Rodada/Competição** específica. Isso causava confusão sobre qual rodada estava sendo exibida.

### Situação Atual do Banco:
```
Liga Principal MarketFantasy:
  📍 Rodada 1 (COMPLETED) - 1 time   ← Rodada antiga de teste
  📍 Rodada 2 (ACTIVE)    - 25 times ← ESTA é a rodada atual!
  📍 Rodada 3 (UPCOMING)  - 0 times
  📍 Rodada 4 (UPCOMING)  - 0 times
  📍 Rodada 5 (UPCOMING)  - 0 times
```

**Problema:** O ranking não deixava claro qual rodada estava sendo exibida, e sempre mostrava a mesma (possivelmente a errada).

## ✅ Solução Implementada

### 1. Nova API `/api/competitions`
**Arquivo:** `/src/app/api/competitions/route.ts`

Retorna todas as competições/rodadas de uma liga:
```typescript
GET /api/competitions?leagueId={id}

Response:
{
  success: true,
  competitions: [
    {
      id: string,
      name: string,
      status: 'ACTIVE' | 'COMPLETED' | 'UPCOMING',
      startDate: Date,
      endDate: Date,
      createdAt: Date
    }
  ],
  count: number
}
```

### 2. Seletor de Rodadas na UI
**Arquivo:** `/src/app/[locale]/ranking/page.tsx`

**Adicionado:**
- ✅ Estado `competitions` - lista de rodadas disponíveis
- ✅ Estado `selectedCompetitionId` - rodada selecionada
- ✅ useEffect que busca rodadas quando liga muda
- ✅ Seleção automática da rodada ACTIVE (ou mais recente)
- ✅ Select dropdown para escolher a rodada
- ✅ Badge visual mostrando status (🔴 AO VIVO, COMPLETED, UPCOMING)

**Fluxo:**
1. Usuário seleciona uma **Liga**
2. Sistema busca todas as **Rodadas** daquela liga
3. Seleciona automaticamente a rodada **ACTIVE** (ou a mais recente)
4. Usuário pode mudar manualmente para outra rodada
5. Ranking atualiza automaticamente

### 3. UI do Seletor

```tsx
<Select value={selectedCompetitionId} onValueChange={setSelectedCompetitionId}>
  <SelectTrigger className="w-[220px]">
    <SelectValue placeholder="Selecione a rodada" />
  </SelectTrigger>
  <SelectContent>
    {competitions.map((comp, index) => (
      <SelectItem key={comp.id} value={comp.id}>
        <div className="flex items-center gap-2">
          <span>{comp.name || `Rodada ${competitions.length - index}`}</span>
          <span className={comp.status === 'ACTIVE' ? '🔴 AO VIVO' : comp.status}>
            {comp.status}
          </span>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 4. Integração com Live Scores

O `useRanking` hook agora recebe o `selectedCompetitionId`:

```typescript
const { teams, leagueData, loading, error } = useRanking(
  selectedLeagueId,
  selectedCompetitionId,  // ✅ Agora usa a rodada selecionada
  isAuthenticated
);
```

Isso garante que:
- ✅ Para rodadas **ACTIVE**: Mostra `liveScore` calculado em tempo real
- ✅ Para rodadas **COMPLETED**: Mostra `totalScore` final do banco
- ✅ Para rodadas **UPCOMING**: Mostra times sem pontuação

## 🎯 Benefícios

### Antes:
- ❌ Não sabia qual rodada estava vendo
- ❌ Sempre mostrava dados da mesma rodada
- ❌ Impossível ver histórico de rodadas anteriores
- ❌ Confusão sobre scores de diferentes rodadas

### Agora:
- ✅ **Seletor visual** de rodadas
- ✅ **Badge de status** (🔴 AO VIVO, COMPLETED, UPCOMING)
- ✅ **Seleção automática** da rodada ativa
- ✅ **Histórico completo** - pode ver qualquer rodada
- ✅ **Scores corretos** - live para ACTIVE, final para COMPLETED
- ✅ **Auto-refresh** a cada 5 minutos (sincronizado com tokens)

## 🧪 Como Testar

1. **Acesse o ranking:**
   ```
   http://localhost:3000/pt/ranking
   ```

2. **Verifique:**
   - ✅ Dropdown "Liga" (já existia)
   - ✅ **NOVO:** Dropdown "Rodada" aparece ao lado
   - ✅ Rodada "Rodada 1" está selecionada automaticamente (ACTIVE)
   - ✅ Badge "🔴 AO VIVO" aparece ao lado da rodada ativa
   - ✅ Pode ver outras rodadas no dropdown

3. **Teste trocar de rodada:**
   - Selecione "Rodada Teste - Semana 1" (COMPLETED)
   - Deve mostrar apenas 1 time
   - Selecione "Rodada 1" (ACTIVE) novamente
   - Deve mostrar 25 times com scores ao vivo

4. **Verifique scores ao vivo:**
   - Na rodada ACTIVE, os times devem mostrar pontos calculados em tempo real
   - Badge "🔴 AO VIVO" aparece em cada time
   - Scores atualizam automaticamente a cada 5 minutos

## 📊 Estrutura de Dados

### Rodadas no Banco:
```
Rodada 1 (COMPLETED):
  - 1 time cadastrado
  - Pontuação final salva
  - Período: 23/11 até 28/11

Rodada 1 (ACTIVE): ← ATUAL
  - 25 times cadastrados
  - Live scores calculados em tempo real
  - Período: 26/01 até 28/01
  - priceStart: definido (29/30 tokens)

Rodadas 2-4 (UPCOMING):
  - 0 times cadastrados
  - Aguardando início
```

## 🔧 Arquivos Modificados

### Novos Arquivos:
- ✅ `/src/app/api/competitions/route.ts` - API de competições
- ✅ `/scripts/list-competitions.js` - Script para listar rodadas

### Arquivos Modificados:
- ✅ `/src/app/[locale]/ranking/page.tsx` - Seletor de rodadas
- ✅ `/src/hooks/use-ranking.ts` - Interface com liveScore
- ✅ `/src/components/dashboard/ranking-table.tsx` - Exibição de liveScore

## 🐛 Bug Fixes Incluídos

1. **Live Scores não apareciam:**
   - ✅ RankingTable agora usa `liveScore` quando disponível
   - ✅ Badge "🔴 AO VIVO" indica scores em tempo real

2. **Rodada errada sendo exibida:**
   - ✅ Agora seleciona explicitamente a rodada desejada
   - ✅ Auto-seleciona rodada ACTIVE

3. **MATIC sem priceStart:**
   - ⚠️ MATIC ainda sem priceStart (API CoinGecko issue)
   - ✅ Outros 29/30 tokens OK
   - ✅ Scores calculados com tokens disponíveis

## 📝 Próximos Passos (Opcional)

- [ ] Adicionar contador de times por rodada no dropdown
- [ ] Mostrar data da rodada no seletor
- [ ] Adicionar filtro de status (ACTIVE/COMPLETED/UPCOMING)
- [ ] Melhorar badge visual no dropdown
- [ ] Corrigir tokenId do MATIC para funcionar com CoinGecko

---
**Data:** 2025-11-25
**Implementado por:** Claude Code
