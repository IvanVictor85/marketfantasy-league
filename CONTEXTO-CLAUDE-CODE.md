# CONTEXTO COMPLETO - Projeto MFL (Market Fantasy League)
**Para nova sessão do Claude Code após instalação**
**Gerado em:** 03/02/2026

---

## INFORMAÇÕES DO PROJETO

| Campo | Valor |
|-------|-------|
| **Diretório** | `D:\cultura-builder\projects\cryptofantasy-league` |
| **Stack** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, PostgreSQL |
| **Blockchain** | Solana (Devnet), `@solana/wallet-adapter` |
| **Auth** | SIWS (Sign-In with Solana) + JWT |
| **i18n** | next-intl com roteamento `[locale]` (pt/en) |
| **UI** | Radix UI, Lucide Icons, Framer Motion |
| **GitHub** | https://github.com/IvanVictor85/marketfantasy-league |

---

## RESUMO EXECUTIVO

O **CryptoFantasy League** é um fantasy game de criptomoedas na rede Solana. Usuários montam times com 10 tokens e competem em rodadas semanais. A pontuação é baseada na variação percentual dos tokens durante o período da rodada.

### Estrutura do Jogo
- **Temporada** → Contém múltiplas rodadas
- **Rodada** → Dura alguns dias, snapshot de preços no início e fim
- **Pontuação** → Soma das variações percentuais dos tokens do time
- **Multiplicador de Participação** → `(Rodadas Jogadas / Total) × Pontos Brutos`

---

## 1. SISTEMA DE CACHE COINGECKO

### Problema Resolvido
API da CoinGecko tem rate limit agressivo (30 req/min free tier).

### Solução
**Arquivos:** `src/lib/services/cache/*`, `src/lib/coingecko/*`

- **Cache em 2 níveis:** L1 (memória 2min) + L2 (arquivo JSON 30min)
- **SWR Pattern:** Retorna stale imediatamente, revalida em background
- **Mutex:** Previne thundering herd
- **Request Deduplication:** Evita requisições duplicadas
- **Fallback:** Ghost tokens com logos de CDN quando 429

**Métricas:**
| Antes | Depois |
|-------|--------|
| 6.000 req/hora | ~14 req/hora |
| 350ms latência | 15ms latência |
| 30% cache hit | 90%+ cache hit |

---

## 2. SISTEMA DE TEMPORADA (SEASON)

### Funcionalidades
- Ranking acumulado de múltiplas rodadas
- Pontos parciais da rodada ativa em tempo real
- Auto-refresh a cada 30 segundos
- Prêmios estimados (50%, 30%, 20% para Top 3)
- Breakdown detalhado por rodada

### Multiplicador de Participação
```
Pontuação Final = Pontos Brutos × (Rodadas Jogadas / Total Rodadas)
```

**Exemplo:**
- Jogador A: 200 pts × (2/10) = 40 pts finais
- Jogador B: 150 pts × (10/10) = 150 pts finais (VENCE!)

### Arquivos
- `src/app/api/season/ranking/route.ts` - API endpoint
- `src/components/dashboard/season-ranking-table.tsx` - Componente ranking
- `src/components/dashboard/round-results.tsx` - Breakdown por rodada

---

## 3. AUTENTICAÇÃO SIWS

### Fluxo
1. Frontend solicita nonce → `/api/auth/nonce`
2. Usuário assina mensagem com carteira
3. Backend verifica com TweetNaCl → `/api/auth/verify-wallet`
4. Retorna JWT + Cookie httpOnly

### Arquivos
- `src/contexts/auth-context.tsx` - Context de autenticação
- `src/app/api/auth/nonce/route.ts`
- `src/app/api/auth/verify-wallet/route.ts`

---

## 4. WALLET CONNECT MODAL (SESSÃO ATUAL - FEVEREIRO 2026)

### Problemas Resolvidos
1. Modal do wallet-adapter nativo não funcionava
2. Precisava clicar duas vezes para conectar
3. `WalletNotSelectedError` no primeiro clique

### Solução Arquitetural
- **Abandonado:** Modal do `@solana/wallet-adapter-react-ui`
- **Usado:** Modal customizado `WalletConnectModal`
- **Contexto próprio:** `WalletModalContext` com `openModal()`/`closeModal()`

### Fluxo de Conexão
```
User clica "Conectar Carteira"
  → openModal() do WalletModalContext
  → WalletConnectModal abre com lista de wallets
  → User clica em Phantom/Solflare
  → handleSelectWallet() → select(walletName)
  → useEffect detecta wallet selecionado → connect()
  → Carteira abre popup
  → Auth-context faz SIWS automático
  → Modal fecha com animação de sucesso
```

### Design Premium
- **Glassmorphism:** `bg-gradient-to-b from-gray-900/95 to-gray-950/98 backdrop-blur-xl`
- **Ambient glow:** Blobs roxo/verde com `blur-[100px]` atrás do modal
- **Grid 2 colunas:** Recomendadas (Phantom, Solflare) + Outras
- **Ícones padronizados:** `ICON_SIZE_RECOMMENDED = 40`, `ICON_SIZE_OTHER = 28`
- **Hover effects:** `whileHover={{ scale: 1.03 }}`, glow border
- **Framer Motion:** Animações de entrada, stagger, spring

### Arquivos Modificados
| Arquivo | Mudança |
|---------|---------|
| `src/components/wallet/wallet-connect-modal.tsx` | Redesign completo + lógica select/connect |
| `src/components/layout/WalletConnectButton.tsx` | Usa `useAppWalletModal` do contexto customizado |
| `src/components/providers/wallet-provider.tsx` | `autoConnect={false}`, adapters configurados |
| `src/contexts/wallet-modal-context.tsx` | Context para controlar modal |

### Configurações Importantes
```typescript
// wallet-provider.tsx
autoConnect={false}
wallets={[PhantomWalletAdapter, SolflareWalletAdapter, LedgerWalletAdapter]}

// wallet-connect-modal.tsx
RECOMMENDED_WALLETS = new Set(['Phantom', 'Solflare'])
pendingConnectRef // Ref para sincronizar select/connect
```

---

## 5. SEGURANÇA

### Helius Proxy
**Arquivo:** `src/app/api/helius/rpc/route.ts`
- Whitelist de métodos RPC permitidos
- Rate limiting por IP
- API key nunca exposta no client

### CSP Header
**Arquivo:** `middleware.ts`
- Modo `Content-Security-Policy-Report-Only` (strict quebrava wallet extensions)

### Chaves
- Removido `NEXT_PUBLIC_HELIUS_API_KEY` (só usa `HELIUS_API_KEY` server-side)

---

## 6. CORREÇÕES CRÍTICAS (HISTÓRICO)

### Cron Jobs
Campos corrigidos: `startTime` → `startDate`, `endTime` → `endDate`

### Loop de Pagamento
**Arquivo:** `src/app/api/team/route.ts`
- Antes: Buscava por `leagueId`
- Depois: Busca por `competitionId`

### Imagens 403
Migração: `assets.coingecko.com` → `coin-images.coingecko.com`

### i18n
Links corrigidos com `LocalizedLink` em vez de `Link`

---

## 7. SMART CONTRACT (PROBLEMA PENDENTE)

### Status
- ❌ Transfere 0.01 SOL ao invés de 0.025 SOL
- ✅ Código fonte correto (`25_000_000` lamports)
- ❌ Bytecode deployed é antigo

### Endereços
- **Program ID:** `7QHMrTeoLTggAy11kTTEwtoRzcvK8rEeY1TRu4oUdgGP`
- **Vault PDA:** `EnrF1zAjUWS3BdDfPdihWoYBcLhFzWmE9e4KFNxyJyq4`

### Solução Proposta
```bash
anchor clean
rm -rf target/
anchor build
anchor upgrade target/deploy/cryptofantasy.so \
  --program-id 7QHMrTeoLTggAy11kTTEwtoRzcvK8rEeY1TRu4oUdgGP \
  --provider.cluster devnet
```

---

## 8. ESTRUTURA DE ARQUIVOS

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx           # WalletModalProvider, WalletConnectModalGlobal
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── ranking/page.tsx     # Opção "Temporada" no seletor
│   │   ├── teams/teams-content.tsx
│   │   └── help/page.tsx        # Página de regras
│   └── api/
│       ├── auth/nonce, verify-wallet
│       ├── season/ranking/route.ts
│       ├── helius/rpc/route.ts
│       ├── market/route.ts
│       └── cron/competition-start, competition-end, check-competitions
├── components/
│   ├── wallet/
│   │   ├── wallet-connect-modal.tsx        # Modal redesenhado
│   │   └── wallet-connect-modal-global.tsx
│   ├── layout/
│   │   ├── WalletConnectButton.tsx
│   │   └── navbar.tsx
│   ├── dashboard/
│   │   ├── season-ranking-table.tsx
│   │   └── round-results.tsx
│   └── providers/
│       └── wallet-provider.tsx
├── contexts/
│   ├── auth-context.tsx
│   └── wallet-modal-context.tsx
├── lib/
│   ├── coingecko/cache.ts, client.ts
│   ├── services/cache/*
│   └── helius/config.ts
└── middleware.ts
```

---

## 9. SCRIPTS ÚTEIS

```bash
# Diagnóstico
node scripts/check-season-status.js
node scripts/check-prize-claims.js
node scripts/test-api-rankings.js

# Correção
node scripts/populate-season-rankings.js
node scripts/populate-prize-claims-retroactive.js
node scripts/clear-next-cache.bat

# Operação
node scripts/snapshot-initial.js
node scripts/snapshot-final.js
node scripts/update-rounds-dates.js
```

---

## 10. DEPENDÊNCIAS IMPORTANTES

```json
{
  "framer-motion": "^11.x",
  "@solana/wallet-adapter-react": "^0.15.x",
  "@solana/wallet-adapter-react-ui": "^0.9.x",
  "@solana/wallet-adapter-wallets": "^0.19.x",
  "next-intl": "^3.x",
  "prisma": "^5.x"
}
```

---

## 11. INFORMAÇÕES DO USUÁRIO

| Campo | Valor |
|-------|-------|
| Email | pretimaoairdrops@gmail.com |
| Wallet | H2312uRYYfSFsKiJeMwSriv6F7iEBkWxtPQCV6ArRAjT |
| Username | Tokenizer |
| Team Name | Sport Club Receba |

---

## 12. DOCUMENTOS DE REFERÊNCIA

Ler estes arquivos para contexto completo:
- `RELEASE-V2.md` - Release notes da V2 (cache, season, auth, correções)
- `RESUMO-ULTIMOS-7-DIAS.md` - Histórico detalhado das últimas sessões
- `DIAGNOSTICO-PONTUACAO.md` - Análise do sistema de pontuação

---

## 13. ESTADO ATUAL (FEVEREIRO 2026)

### ✅ Funcionando
- Login com wallet (SIWS)
- Modal de carteira com design premium (um clique conecta)
- Cache CoinGecko eficiente
- Sistema de temporadas com multiplicador
- Navegação i18n
- Segurança do Helius proxy

### ⚠️ Pendente
- Smart contract transferindo valor errado (0.01 vs 0.025 SOL)
- Algumas traduções EN incompletas
- Deploy do smart contract corrigido

---

## COMO CONTINUAR

1. Abra o projeto: `cd D:\cultura-builder\projects\cryptofantasy-league`
2. Instale dependências: `npm install`
3. Rode: `npm run dev`
4. Teste o modal de carteira conectando com Phantom

---

*Gerado automaticamente pelo Claude Code - Sessão Fevereiro 2026*
