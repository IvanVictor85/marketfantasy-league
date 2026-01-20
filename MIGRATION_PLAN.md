# 🔄 Plano de Migração: Team → UserTeam

## 📊 Situação Atual

### Problema Identificado:
A API `/api/team` está usando o modelo **LEGADO** (`Team`) em vez do modelo **CORRETO** (`UserTeam`).

### Consequências:
- ❌ Times não vinculados a rodadas específicas
- ❌ Histórico sendo sobrescrito a cada rodada
- ❌ Impossível ter times diferentes por rodada
- ❌ Arquitetura correta existe mas não está sendo usada

---

## 🎯 Arquitetura Correta (Já existe no Prisma!)

```prisma
model UserTeam {
  userId        String
  competitionId String      ✅ Vínculo com RODADA específica
  players       Json        ✅ Array de tokens
  totalPoints   Decimal     ✅ Pontuação DA RODADA
  teamName      String?

  @@unique([userId, competitionId])  ✅ Um time por usuário por rodada!
}
```

### Fluxo Correto:
1. Usuário entra na **Rodada 1** → Cria time → Salvo com `competitionId=rodada1`
2. Usuário entra na **Rodada 2** → Cria time → Salvo com `competitionId=rodada2`
3. **Ambos os times ficam salvos!**
4. Histórico preservado ✅

---

## 🔧 Mudanças Necessárias

### 1. **API `/api/team/route.ts`**

#### GET Endpoint:
**Antes**:
```typescript
// Busca por userId + leagueId (ERRADO)
const team = await prisma.team.findFirst({
  where: { userId, leagueId }
});
```

**Depois**:
```typescript
// Busca por userId + competitionId (CORRETO)
let competitionId = searchParams.get('competitionId');

// Se não veio, busca a rodada ACTIVE
if (!competitionId) {
  const activeComp = await prisma.competition.findFirst({
    where: { leagueId, status: 'ACTIVE' }
  });
  competitionId = activeComp?.id;
}

const userTeam = await prisma.userTeam.findUnique({
  where: { userId_competitionId: { userId, competitionId } }
});
```

#### POST Endpoint:
**Antes**:
```typescript
// Salva em Team (LEGADO)
await prisma.team.upsert({
  where: { userId_leagueId: { userId, leagueId } },
  update: { tokens, ... },
  create: { userId, leagueId, tokens, ... }
});
```

**Depois**:
```typescript
// Salva em UserTeam (CORRETO)
let competitionId = body.competitionId;

// Se não veio, busca a rodada ACTIVE
if (!competitionId) {
  const activeComp = await prisma.competition.findFirst({
    where: { leagueId, status: 'ACTIVE' }
  });
  competitionId = activeComp?.id;
}

await prisma.userTeam.upsert({
  where: { userId_competitionId: { userId, competitionId } },
  update: { players, ... },
  create: { userId, competitionId, players, ... }
});
```

---

### 2. **Frontend `teams-content.tsx`**

#### Buscar competitionId:
```typescript
// Já temos via useCompetitionStatus!
const { competition: competitionData } = useCompetitionStatus({
  competitionId: selectedLeagueId,
  enabled: selectedLeagueId !== 'main_template'
});

const currentCompetitionId = competitionData?.competitionId;
```

#### Passar para API:
```typescript
// GET
const response = await fetch(
  `/api/team?leagueId=${leagueId}&competitionId=${currentCompetitionId}`
);

// POST
await fetch('/api/team', {
  method: 'POST',
  body: JSON.stringify({
    leagueId,
    competitionId: currentCompetitionId,
    teamName,
    tokens
  })
});
```

---

### 3. **Migração de Dados Existentes**

Script para migrar times de `Team` → `UserTeam`:

```javascript
// scripts/migrate-teams-to-userteam.js
async function migrateTeams() {
  const legacyTeams = await prisma.team.findMany();

  for (const team of legacyTeams) {
    // Buscar a competição ACTIVE da liga
    const activeComp = await prisma.competition.findFirst({
      where: {
        leagueId: team.leagueId,
        status: 'ACTIVE'
      }
    });

    if (!activeComp) continue;

    // Criar em UserTeam
    await prisma.userTeam.create({
      data: {
        userId: team.userId,
        competitionId: activeComp.id,
        players: JSON.parse(team.tokens),
        totalPoints: team.totalScore || 0,
        teamName: team.teamName
      }
    });
  }
}
```

---

### 4. **Outros Endpoints Impactados**

#### ✅ Já Correto:
- `/api/league/check-entry` - já usa `competitionId`
- `/api/competition/status` - retorna `competitionId`

#### ❌ Precisa Atualizar:
- Cálculo de score (se houver endpoint)
- Rankings por rodada
- Histórico de times

---

## 📝 Ordem de Implementação

### Fase 1: Preparação ✅
1. ✅ Criar este documento de planejamento
2. ⏳ Revisar com você
3. ⏳ Fazer backup do banco de dados

### Fase 2: Backend
1. Criar nova versão de `/api/team/route.ts` usando `UserTeam`
2. Manter endpoint legado temporariamente (fallback)
3. Criar script de migração de dados

### Fase 3: Frontend
1. Atualizar `teams-content.tsx` para passar `competitionId`
2. Atualizar outros componentes que chamam `/api/team`

### Fase 4: Migração
1. Executar script de migração (Team → UserTeam)
2. Testar fluxo completo
3. Verificar dados migrados

### Fase 5: Limpeza
1. Remover código legado
2. Remover tabela `Team` (após confirmar sucesso)

---

## ⚠️ Riscos e Mitigações

### Risco 1: Perda de dados durante migração
**Mitigação**: Backup completo do banco antes de começar

### Risco 2: Frontend quebrar durante transição
**Mitigação**: Manter endpoint legado funcionando em paralelo

### Risco 3: Times existentes ficarem órfãos
**Mitigação**: Script de migração cuidadoso com logs detalhados

---

## 🎯 Resultado Esperado

Após migração completa:
- ✅ Times vinculados a rodadas específicas
- ✅ Histórico preservado por rodada
- ✅ Usuário pode ter times diferentes em cada rodada
- ✅ Rankings corretos por rodada
- ✅ Sistema escalável para múltiplas temporadas

---

## 🤔 Decisões Necessárias

Antes de começar, preciso que você confirme:

1. **Fazer backup do banco agora?**
2. **Começar pela migração da API?**
3. **Manter endpoint legado por quanto tempo?**
4. **Tem dados de produção que precisam ser preservados?**

---

**Aguardando sua aprovação para começar! 🚀**
