# 🎬 Guia Completo de Demonstração - CryptoFantasy League

## 📋 Visão Geral

Este guia contém tudo que você precisa para gravar uma demonstração profissional do sistema de competição em tempo real.

## 🚀 Quick Start (3 comandos)

```bash
# 1. Popular banco com dados fake
npm run demo:seed

# 2. Iniciar servidor Next.js
npm run dev

# 3. Iniciar simulação (em outro terminal)
npm run demo:simulate 1
```

Acesse: `http://localhost:3000/pt/competition/1`

---

## 🎯 O Que Foi Criado

### ✅ Componentes Visuais (6 arquivos)

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| **CompetitionTimer** | `src/components/competition/CompetitionTimer.tsx` | Countdown animado com status da competição |
| **LiveRankings** | `src/components/competition/LiveRankings.tsx` | Tabela de rankings com animações e top 3 destacado |
| **TokenPerformance** | `src/components/competition/TokenPerformance.tsx` | Performance visual dos tokens com gráficos |
| **Winners** | `src/components/competition/Winners.tsx` | Card de vencedores com animação de confete |
| **useCompetitionStatus** | `src/hooks/useCompetitionStatus.ts` | Hook de auto-refresh a cada 30s |
| **Page** | `src/app/[locale]/competition/[id]/page.tsx` | Página completa integrando todos componentes |

### ✅ Backend

| Arquivo | Descrição |
|---------|-----------|
| **API Route** | `src/app/api/competition/status/route.ts` | Endpoint que retorna status completo da competição |
| **Prisma Schema** | `prisma/schema.prisma` | Relações entre Competition ↔ League atualizadas |

### ✅ Scripts de Demonstração

| Script | Comando | Descrição |
|--------|---------|-----------|
| **Seed** | `npm run demo:seed` | Popula banco com 5 times fake |
| **Simulate** | `npm run demo:simulate [id]` | Simula updates em tempo real |
| **Full** | `npm run demo:full` | Executa seed + simulate |

---

## 🎨 Funcionalidades Visuais

### 1. CompetitionTimer
- ⏰ **Countdown em tempo real** (dias, horas, minutos, segundos)
- 🎨 **Cores dinâmicas**: Amarelo (pending), Verde (active), Roxo (completed)
- 📊 **Barra de progresso animada**
- ✨ **Gradientes e efeitos de blur**

### 2. LiveRankings
- 🥇🥈🥉 **Medalhas visuais** para top 3
- 📈📉 **Setas de variação** (verde sobe, vermelho desce)
- ⚡ **Animação de atualização** (opacity fade)
- 🎯 **Destaque com bordas coloridas** para líderes
- 💎 **Badges de posição** com cores únicas

### 3. TokenPerformance
- 📊 **Barras de progresso** por token
- 💚❤️ **Cores automáticas** (verde positivo, vermelho negativo)
- 🏷️ **Badges de posição**: ATQ, DEF, SUP, WLD
- 📈 **Variação percentual** em tempo real
- 🖼️ **Logos dos tokens** (quando disponível)
- 📉 **Resumo**: Tokens em alta vs baixa

### 4. Winners
- 🎉 **Animação de confete** com emojis caindo
- 🏆 **Pódio visual** estilo olímpico
- 💰 **Distribuição de prêmios** calculada automaticamente
- ✨ **Efeitos de brilho** (glow, ring, shadow)
- 🎨 **Gradientes personalizados** por posição

### 5. Página Principal
- 📊 **4 Cards de estatísticas** (status, participantes, prize pool, vencedores)
- 🔄 **Toggle de auto-refresh** (ON/OFF)
- 📤 **Botões de ação**: Compartilhar, Exportar
- 🌈 **Background com gradientes animados**
- 📱 **Layout responsivo** (desktop e mobile)

---

## 🎥 Roteiro de Demonstração

### Preparação (2 minutos)

1. **Limpar banco e popular dados**
   ```bash
   npm run demo:seed
   ```

2. **Iniciar servidor**
   ```bash
   npm run dev
   ```

3. **Abrir página da competição**
   ```
   http://localhost:3000/pt/competition/1
   ```

### Gravação (5-10 minutos)

#### Parte 1: Visão Geral (1 min)
- Mostrar timer fazendo countdown
- Apontar status "Aguardando Início" (amarelo)
- Mostrar cards de estatísticas no topo
- Explicar layout: 2/3 esquerda, 1/3 direita

#### Parte 2: Rankings (2 min)
- Mostrar tabela de rankings
- Destacar top 3 com medalhas
- Apontar badges de posição
- Mostrar setas de variação (ainda sem mudanças)

#### Parte 3: Performance de Tokens (2 min)
- Scrollar até TokenPerformance do líder
- Mostrar logos dos tokens
- Explicar badges de posição (ATQ, DEF, SUP, WLD)
- Mostrar barras de performance

#### Parte 4: Iniciar Simulação (3 min)
- **Em outro terminal**, executar:
  ```bash
  npm run demo:simulate 1
  ```
- Aguardar competição mudar para "Em Andamento" (verde)
- Mostrar rankings atualizando automaticamente
- Apontar setas de variação mudando
- Mostrar pontuações subindo e descendo
- Performance dos tokens mudando em tempo real

#### Parte 5: Vencedores (2 min)
- Aguardar competição finalizar (10 minutos após início)
- Status muda para "Finalizada" (roxo)
- **Animação de confete** aparece
- Card de Winners é exibido
- Mostrar pódio com top 3
- Mostrar distribuição de prêmios

---

## 📊 Dados de Demonstração

### Times Criados
1. 🚀 Moon Lambo Gang
2. 💎 Diamond Hands Squad
3. 📈 Bull Run Warriors
4. 🐋 Whale Watchers
5. ⚡ Lightning Traders

### Tokens Disponíveis
BTC, ETH, SOL, BNB, ADA, AVAX, MATIC, LINK, DOGE, SHIB

### Posições
- **ATTACK** (⚔️): Multiplicador 1.5x
- **DEFENSE** (🛡️): Multiplicador 1.2x
- **SUPPORT** (✨): Multiplicador 1.3x
- **WILDCARD** (🃏): Multiplicador 2.0x

### Distribuição de Prêmios
- 🥇 **1º Lugar**: 50% do prize pool
- 🥈 **2º Lugar**: 30% do prize pool
- 🥉 **3º Lugar**: 20% do prize pool

---

## 🔧 Configurações

### Auto-Refresh
- **Intervalo padrão**: 30 segundos
- **Configurável em**: `src/hooks/useCompetitionStatus.ts`
- **Toggle na página**: Botão no canto superior direito

### Simulação de Updates
- **Intervalo**: 5 segundos
- **Variação de preços**: -5% a +5%
- **Máximo de iterações**: 20 (100 segundos)
- **Configurável em**: `scripts/simulate-live-updates.ts`

### Duração da Competição
- **Início**: 2 minutos após seed
- **Duração**: 10 minutos
- **Total**: ~12 minutos do seed até o fim

---

## 🎯 Pontos-Chave para Destacar

### Animações
- ✅ Countdown em tempo real
- ✅ Fade in/out ao atualizar rankings
- ✅ Confete caindo nos vencedores
- ✅ Pulse nos badges de medalha
- ✅ Barras de progresso animadas

### Responsividade
- ✅ Layout adapta para mobile
- ✅ Grid responsivo (3 colunas → 1 coluna)
- ✅ Tabela scrollável horizontalmente

### Performance
- ✅ Cache de 30s na API
- ✅ Auto-refresh configurável
- ✅ Updates apenas quando necessário

### UX
- ✅ Loading states bonitos
- ✅ Error handling elegante
- ✅ Estados vazios informativos
- ✅ Feedback visual em todas ações

---

## 🐛 Troubleshooting

### Rankings não atualizam
```bash
# Verificar se auto-refresh está ON (toggle verde)
# Forçar refresh: F5 ou Ctrl+R
```

### Simulação não muda rankings
```bash
# Verificar se script está rodando
# Ver logs no terminal da simulação
# Verificar ID da competição está correto
```

### Erro "Competition not found"
```bash
# Rodar seed novamente
npm run demo:seed

# Pegar novo ID da competição (no output do seed)
# Usar: http://localhost:3000/pt/competition/[NOVO_ID]
```

### Prisma erro de conexão
```bash
# Regenerar cliente
npx prisma generate

# Push schema
npx prisma db push

# Rodar seed novamente
npm run demo:seed
```

---

## 📝 Checklist Pré-Gravação

- [ ] Banco de dados limpo
- [ ] Seed executado com sucesso
- [ ] Servidor Next.js rodando (porta 3000)
- [ ] Página da competição carregando
- [ ] Auto-refresh está ON
- [ ] Script de simulação pronto para executar
- [ ] Terminal visível para mostrar updates
- [ ] Navegador em fullscreen ou tamanho adequado
- [ ] DevTools fechado (a menos que queira mostrar)

---

## 🚀 Após a Gravação

### Próximos Passos
1. **Integrar preços reais**: CoinGecko API
2. **WebSockets**: Updates instantâneos
3. **Histórico de preços**: Gráficos com ChartJS
4. **Notificações**: Toast ao mudar ranking
5. **Compartilhamento social**: Open Graph cards

### Deploy
```bash
# Build de produção
npm run build

# Verificar build
npm run build:check

# Deploy (Vercel recomendado)
vercel deploy
```

---

## 📞 Comandos Úteis

```bash
# Ver banco de dados visualmente
npx prisma studio

# Limpar e recriar banco
npx prisma migrate reset

# Ver logs em tempo real
npm run dev -- --turbo

# Atualizar dependências
npm update

# Verificar tipos TypeScript
npm run build:check
```

---

## 🎉 Resultado Final

Ao seguir este guia, você terá:
- ✅ Sistema de competição funcional
- ✅ Rankings atualizando em tempo real
- ✅ Animações profissionais
- ✅ Design moderno e responsivo
- ✅ Vídeo de demonstração impressionante

**Boa gravação! 🎬🚀**

---

Criado com ❤️ para o CryptoFantasy League
