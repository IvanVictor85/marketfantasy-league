# Contexto Técnico - CryptoFantasy League

## Stack Tecnológica Detalhada

### Frontend
- **Next.js 15+**: App Router, React Server Components
- **TypeScript**: Tipagem estática completa
- **Shadcn/ui**: Componentes modernos e acessíveis
- **Tailwind CSS**: Styling utilitário
- **@solana/wallet-adapter**: Integração com carteiras Solana

### Blockchain & Smart Contracts
- **Solana**: Blockchain de alta performance
- **Anchor Framework**: Framework Rust para Solana
- **@solana/web3.js**: SDK JavaScript para Solana
- **Devnet**: Ambiente de desenvolvimento

### Backend & Dados
- **Next.js API Routes**: Endpoints serverless
- **Prisma**: ORM moderno para TypeScript
- **SQLite**: Database local para desenvolvimento
- **CoinGecko API**: Dados de preços de criptomoedas

## Arquitetura do Sistema

### Fluxo de Dados
1. **Usuário conecta carteira** → Frontend valida conexão
2. **Usuário entra em liga** → Smart contract processa pagamento
3. **Usuário monta time** → API Route salva no SQLite
4. **Competição termina** → Cron job calcula vencedores
5. **Oráculo aciona distribuição** → Smart contract distribui prêmios

### Estrutura de Arquivos
```
src/
├── app/                    # App Router pages
├── components/
│   ├── ui/                # Shadcn/ui components
│   ├── wallet/            # Wallet integration
│   ├── league/            # League components
│   └── team/              # Team building components
├── lib/
│   ├── solana/            # Solana utilities
│   ├── prisma/            # Database client
│   ├── security/          # Security utilities
│   └── mock-data/         # Development data
└── types/                 # TypeScript definitions

programs/
└── cryptofantasy/         # Anchor program
    ├── src/
    │   ├── lib.rs
    │   ├── instructions/
    │   └── state/
    └── Anchor.toml
```

## Padrões de Desenvolvimento

### Convenções de Código
- **Componentes**: PascalCase (ex: `LeagueCard.tsx`)
- **Hooks**: camelCase com prefixo `use` (ex: `useWallet`)
- **Utilities**: camelCase (ex: `formatSolAmount`)
- **Constants**: UPPER_SNAKE_CASE (ex: `DEVNET_RPC_URL`)

### Segurança
- Validação de inputs em todas as camadas
- Sanitização de dados do usuário
- Rate limiting em API Routes
- Verificação de assinatura de carteira
- Auditoria de dependências

### Performance
- Lazy loading de componentes
- Memoização de cálculos pesados
- Otimização de imagens
- Bundle splitting automático

## Integração Solana

### Configuração de Carteira
```typescript
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new TorusWalletAdapter(),
];
```

### Conexão com RPC
```typescript
const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet')
);
```

### Estrutura do Smart Contract
```rust
#[program]
pub mod cryptofantasy {
    use super::*;
    
    pub fn create_league(ctx: Context<CreateLeague>, entry_fee: u64) -> Result<()> {
        // Implementação
    }
    
    pub fn join_league(ctx: Context<JoinLeague>) -> Result<()> {
        // Implementação
    }
    
    pub fn distribute_prizes(
        ctx: Context<DistributePrizes>,
        winners: [Pubkey; 3]
    ) -> Result<()> {
        // Implementação
    }
}
```

## Variáveis de Ambiente

```env
# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Database
DATABASE_URL="file:./dev.db"

# APIs
COINGECKO_API_KEY=your_api_key_here

# Security
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Comandos de Desenvolvimento

```bash
# Frontend
npm run dev          # Iniciar servidor de desenvolvimento
npm run build        # Build de produção
npm run lint         # Linting
npm run type-check   # Verificação de tipos

# Smart Contract
anchor build         # Compilar programa
anchor test          # Executar testes
anchor deploy        # Deploy para devnet

# Database
npx prisma generate  # Gerar cliente Prisma
npx prisma db push   # Aplicar schema
npx prisma studio    # Interface visual
```