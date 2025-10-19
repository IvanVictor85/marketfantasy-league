# 🎬 Scripts de Demonstração - CryptoFantasy League

Scripts para popular o banco de dados e simular o sistema de competição em tempo real para demonstrações em vídeo.

## 📋 Pré-requisitos

- Node.js instalado
- Banco de dados configurado
- Dependências instaladas (`npm install`)

## 🚀 Scripts Disponíveis

### 1. Normalizar Tokens (Manutenção)

Converte tokens do formato antigo (objetos) para o novo formato (array de strings).

```bash
npm run normalize-tokens
# ou
npx tsx scripts/normalize-team-tokens.ts
```

**O que faz:**
- ✅ Varre todos os times no banco
- ✅ Detecta formato antigo: `[{symbol: "BTC", name: "Bitcoin", ...}]`
- ✅ Converte para formato novo: `["BTC", "ETH", "SOL", ...]`
- ✅ Mantém times já normalizados intactos
- ✅ Exibe relatório detalhado

**Quando usar:**
- Após migração de dados
- Ao detectar inconsistências no formato
- Antes de deploy de nova versão

---

### 2. Validar Tokens (Verificação)

Verifica se todos os times estão no formato correto.

```bash
npm run validate-tokens
# ou
npx tsx scripts/validate-all-teams.ts
```

**O que faz:**
- ✅ Valida formato: Array de 10 strings
- ✅ Verifica cada time individualmente
- ✅ Exibe relatório de válidos/inválidos
- ✅ Sugere correção se encontrar problemas

**Resultado esperado:**
```
✅ Todos os times estão no formato correto!
✨ Padrão: ["BTC", "ETH", "SOL", ...]
```

---

### 3. Seed de Dados de Demonstração

Popula o banco com dados fake para demonstração.

```bash
npx tsx scripts/seed-demo-data.ts
```

**O que faz:**
- ✅ Busca ou cria a Liga Principal (MAIN)
- ✅ Cria 5 times com nomes divertidos
- ✅ Cada time recebe 10 tokens aleatórios (BTC, ETH, SOL, etc.)
- ✅ Marca todos como `hasValidEntry = true`
- ✅ Cria uma competição que:
  - Inicia em 2 minutos
  - Termina em 12 minutos (10 min de duração)
  - Status: `pending`
  - Prize Pool calculado automaticamente

**Times criados:**
- 🚀 Moon Lambo Gang
- 💎 Diamond Hands Squad
- 📈 Bull Run Warriors
- 🐋 Whale Watchers
- ⚡ Lightning Traders

**Tokens disponíveis:**
BTC, ETH, SOL, BNB, ADA, AVAX, MATIC, LINK, DOGE, SHIB

**Saída:**
```
🎉 SEED CONCLUÍDO COM SUCESSO!
📊 Liga: Liga Principal
👥 Times criados: 5
🏆 Competição ID: 1
💰 Prize Pool: 0.5 SOL

🌐 Acesse a competição em:
   http://localhost:3000/pt/competition/1
```

---

### 2. Simulação de Atualizações ao Vivo

Simula mudanças em tempo real nos preços e rankings.

```bash
npx tsx scripts/simulate-live-updates.ts [competitionId]
```

**Parâmetros:**
- `competitionId` (opcional): ID da competição. Default: `1`

**Exemplo:**
```bash
npx tsx scripts/simulate-live-updates.ts 1
```

**O que faz:**
- 📊 Atualiza preços dos tokens a cada 5 segundos
- 📈 Variação realista de -5% a +5% por update
- 🎯 Recalcula pontuação dos times baseado na performance
- 🔄 Atualiza rankings automaticamente
- 🏁 Muda status da competição automaticamente:
  - `pending` → `active` (quando atingir startTime)
  - `active` → `completed` (quando atingir endTime)
- 🏆 Define vencedores ao finalizar

**Saída em tempo real:**
```
🔄 Iteração 1/20 - 14:15:30
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Rankings Atualizados:
   1º 📈 Lightning Traders           1425.67 pts (+58.23)
   2º 📉 Diamond Hands Squad         1301.45 pts (-37.57)
   3º 📈 Whale Watchers              1189.32 pts (+66.24)
   4º 📉 Bull Run Warriors            897.91 pts (-27.47)
   5º 📈 Moon Lambo Gang              612.08 pts (+32.75)

⏰ Próxima atualização em 5s...
```

**Interromper:**
Pressione `Ctrl+C` para parar a simulação.

---

## 🎥 Workflow para Demonstração em Vídeo

### Passo 1: Popular Dados
```bash
npx tsx scripts/seed-demo-data.ts
```

Aguarde a mensagem de sucesso e copie o ID da competição.

### Passo 2: Abrir a Página
Abra no navegador:
```
http://localhost:3000/pt/competition/1
```

### Passo 3: Iniciar Simulação
Em outro terminal, execute:
```bash
npx tsx scripts/simulate-live-updates.ts 1
```

### Passo 4: Gravar
- Os rankings serão atualizados automaticamente a cada 30s na página
- A simulação atualiza o banco a cada 5s
- Você verá:
  - ⏱️ Timer fazendo countdown
  - 📊 Rankings mudando em tempo real
  - 📈 Barras de performance animadas
  - 🏆 Vencedores quando finalizar

### Passo 5: Limpar e Repetir
Para criar novos dados e repetir:
```bash
npx tsx scripts/seed-demo-data.ts
```

O script limpa os dados antigos automaticamente.

---

## 🎨 Funcionalidades Visuais na Demonstração

### CompetitionTimer
- ⏰ Countdown animado
- 🎨 Cores dinâmicas por status
- 📊 Barra de progresso

### LiveRankings
- 🥇🥈🥉 Medalhas para top 3
- 📈📉 Indicadores de variação
- ✨ Animações de atualização
- 🎯 Destaque visual para líderes

### TokenPerformance
- 📊 Barras de performance
- 💚❤️ Cores por variação
- 🏷️ Badges de posição (ATQ, DEF, SUP, WLD)
- 📈 Variação percentual em tempo real

### Winners
- 🎉 Animação de confete
- 🏆 Pódio visual
- 💰 Distribuição de prêmios
- ✨ Efeitos de brilho

---

## 🐛 Troubleshooting

### Erro: "Liga principal não encontrada"
O script cria automaticamente. Se persistir, verifique o banco de dados.

### Erro: "Competição não encontrada"
Verifique se o ID está correto:
```bash
npx tsx scripts/simulate-live-updates.ts 1
```

### Página não atualiza
- Verifique se o auto-refresh está ON (toggle no topo)
- Intervalo de refresh: 30s
- Force refresh manual: F5

### Prisma não conecta
```bash
npx prisma generate
npx prisma db push
```

---

## 📝 Notas Técnicas

### Cálculo de Pontuação
```typescript
pontuação = variação% × multiplicador_posição × 10

Multiplicadores:
- ATTACK: 1.5x
- DEFENSE: 1.2x
- SUPPORT: 1.3x
- WILDCARD: 2.0x
```

### Variação de Preços
- Intervalo: -5% a +5% por update
- Frequência: 5 segundos
- Proteção: Nunca cai mais de 50% do preço inicial

### Distribuição de Prêmios
```json
{
  "first": 50,   // 50% do prize pool
  "second": 30,  // 30% do prize pool
  "third": 20    // 20% do prize pool
}
```

---

## 🚀 Próximos Passos

1. **Integrar preços reais**: Substituir mock por CoinGecko API
2. **WebSockets**: Updates instantâneos sem polling
3. **Histórico de preços**: Gráficos com histórico completo
4. **Mais tokens**: Expandir pool de tokens disponíveis
5. **Mascotes personalizados**: Avatares únicos por time

---

## 📞 Suporte

Se encontrar problemas, verifique:
1. Banco de dados está rodando
2. `.env` configurado corretamente
3. Dependências instaladas
4. Porta 3000 livre

**Comandos úteis:**
```bash
# Ver logs do Prisma
npx prisma studio

# Reset banco (CUIDADO!)
npx prisma migrate reset

# Regenerar cliente
npx prisma generate
```

---

Feito com ❤️ para demonstrações épicas! 🚀
