# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CryptoFantasy League (CFL) is a Web3 fantasy game where users build teams of 10 cryptocurrencies and compete in paid leagues based on real market performance. Built on Solana blockchain with Next.js frontend.

## Common Development Commands

### Frontend Development
```bash
npm run dev              # Start Next.js development server on localhost:3000
npm run build            # Production build (runs prisma generate + next build)
npm run build:safe       # Safe build using custom script
npm run build:check      # Type-check without emitting files
npm start                # Start production server
npm run lint             # Run ESLint
```

### Database (Prisma + SQLite)
```bash
npx prisma generate      # Generate Prisma client (required after schema changes)
npx prisma db push       # Push schema changes to database
npx prisma studio        # Open visual database editor
```

### Solana Smart Contracts (Anchor)
```bash
anchor build             # Compile Rust program
anchor test              # Run smart contract tests
anchor deploy            # Deploy to devnet
```

### Token Management
```bash
npm run update-tokens    # Update valid token list from CoinGecko API
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 15+ (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Solana (Devnet), Anchor Framework (Rust)
- **Database**: Prisma ORM + SQLite (dev), supports PostgreSQL (production)
- **APIs**: CoinGecko (market data), Helius (Solana enhancements), Gemini AI (mascot generation)
- **Authentication**: NextAuth.js with wallet integration

### Key Architectural Patterns

#### 1. Hybrid On-Chain/Off-Chain Architecture
- **On-Chain (Solana Smart Contract)**: League creation, entry fee payments, prize distribution
- **Off-Chain (Next.js + Prisma)**: Team formations, token selections, score calculations
- **Oracle Pattern**: API routes calculate winners and trigger on-chain prize distribution

#### 2. Solana Program Structure
Located in `programs/cryptofantasy/src/lib.rs`:
- **Instructions**: `initialize_league`, `enter_league`, `distribute_prizes`
- **Accounts**: `League` (league state), `treasury_pda` (prize pool)
- **PDAs**: League PDA derived from admin pubkey, Treasury PDA derived from league key

#### 3. Database Schema (Prisma)
Key models in `prisma/schema.prisma`:
- **League**: Stores league metadata, treasury PDA address, entry fees
- **LeagueEntry**: Tracks user payments with Solana transaction hashes
- **Team**: Stores user team formations (10 tokens in JSON), scores, rankings
- **Token**: Validated tokens from CoinGecko top 100
- **PriceHistory**: Historical price data for scoring

#### 4. Solana Transaction Handling
Located in `src/lib/solana/program.ts`:
- **Robust retry logic**: Handles blockhash expiration with exponential backoff (up to 5 retries)
- **Priority fees**: Integrates Helius API for optimal transaction fees
- **Transaction caching**: Prevents duplicate submissions within 30-second window
- **Network connectivity checks**: Multi-attempt validation before sending
- **Development treasury**: Deterministic keypair for testing deposits/withdrawals

#### 5. Token Validation System
Documented in `docs/TOKEN_VALIDATION.md`:
- Only top 100 tokens by market cap are valid (from CoinGecko)
- Validation happens both client-side and server-side
- Update with `npm run update-tokens` to refresh valid token list
- Stored in `src/lib/valid-tokens.ts`

#### 6. API Integration
- **Helius Services** (`src/lib/helius/`):
  - `priority-fee.ts`: Dynamic fee recommendations
  - `enhanced-transactions.ts`: Detailed transaction analysis
  - `webhooks.ts`: Real-time blockchain event monitoring
- **CoinGecko** (`src/lib/xstocks/coingecko.ts`): Market data with caching (15-min TTL)

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Internationalized routes (pt/en)
│   │   ├── dashboard/            # User dashboard
│   │   ├── teams/                # Team builder interface
│   │   ├── ligas/                # League browsing
│   │   ├── market/               # Token market explorer
│   │   └── perfil/               # User profile
│   ├── api/                      # API Routes
│   │   ├── league/               # League management endpoints
│   │   ├── team/                 # Team CRUD operations
│   │   ├── tokens/               # Token data API
│   │   ├── market/               # Market analysis
│   │   └── auth/                 # Authentication
│   └── providers/                # React context providers
├── components/
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── solana/                   # Solana integration
│   │   ├── connection.ts         # RPC connection management
│   │   └── program.ts            # Smart contract interactions
│   ├── helius/                   # Helius API integration
│   ├── xstocks/                  # Market data (CoinGecko)
│   ├── prisma.ts                 # Database client
│   ├── valid-tokens.ts           # Token validation
│   └── utils.ts                  # Shared utilities
└── types/                        # TypeScript definitions

programs/
└── cryptofantasy/                # Anchor program (Rust)
    └── src/
        └── lib.rs                # Smart contract logic

prisma/
└── schema.prisma                 # Database schema
```

### Environment Variables

Critical variables (see `.env.example` for full list):
```bash
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=11111111111111111111111111111112

# Database
DATABASE_URL="file:./dev.db"  # SQLite for dev, PostgreSQL for prod

# Helius (Solana enhancements)
HELIUS_API_KEY=your_key_here
NEXT_PUBLIC_HELIUS_API_KEY=your_key_here

# AI (mascot generation)
AI_IMAGE_PROVIDER=nano-banana  # Options: nano-banana, openai, huggingface
GEMINI_API_KEY=your_key_here
```

### Path Alias

TypeScript path alias: `@/*` maps to `./src/*`
```typescript
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
```

## Important Implementation Notes

### Solana Transaction Best Practices
1. **Always use fresh blockhash**: The code in `src/lib/solana/program.ts` implements automatic blockhash refreshing with retry logic
2. **Handle wallet disconnects**: Set `transactionActive` flag to suppress errors during signing
3. **Priority fees**: Use Helius API recommendations (low/medium/high levels)
4. **Error handling**: Provide user-friendly Portuguese messages for common errors

### Token Validation Workflow
1. User selects tokens in team builder UI
2. Client validates against `src/lib/valid-tokens.ts`
3. Server validates again in `/api/team` before saving
4. Returns specific invalid tokens if validation fails
5. Update token list weekly with `npm run update-tokens`

### League Payment Flow
1. User connects Solana wallet (Phantom, Solflare, etc.)
2. Frontend calls smart contract's `enter_league` instruction
3. SOL transferred to Treasury PDA (program-controlled account)
4. Transaction hash stored in `LeagueEntry` table
5. Frontend confirms payment via `/api/league/confirm-entry`

### Prize Distribution
1. Competition ends (Sunday 21h to Friday 21h)
2. API route (oracle) calculates top 3 winners from team scores
3. Calls smart contract's `distribute_prizes` instruction
4. On-chain distribution: 50% 1st, 30% 2nd, 20% 3rd

### Internationalization
- Uses `next-intl` for i18n
- Languages: Portuguese (pt), English (en)
- Routes: `/[locale]/path` structure
- Translation files: Check `messages/` directory

## Deployment

### Vercel (Frontend)
- Configured with `output: 'standalone'` in `next.config.js`
- Auto-deploys from Git
- Set environment variables in Vercel dashboard
- See `VERCEL_SETUP.md` for detailed instructions

### Solana Program (Smart Contract)
```bash
anchor build
anchor deploy --provider.cluster devnet
# Update NEXT_PUBLIC_PROGRAM_ID in .env with deployed program ID
```

## Security Considerations

1. **OWASP Compliance**: Implemented across all layers (see `docs/PRD.md`)
2. **Input Validation**: All user inputs validated and sanitized
3. **Rate Limiting**: Implemented on sensitive API routes
4. **Wallet Signature Verification**: Prevents unauthorized actions
5. **Development Treasury**: Uses deterministic keypair (NEVER use in production)

## Testing Strategy

- **Smart Contracts**: `anchor test` (Rust tests)
- **API Routes**: Test via frontend or API clients
- **Frontend**: Manual testing with wallet integration
- **Database**: Use Prisma Studio for inspection

## Common Issues & Solutions

### Build Errors
- Run `npx prisma generate` if Prisma client is missing
- Check `npm run build:check` for type errors before building

### Solana Transaction Failures
- "Blockhash expired": Retry automatically handled by `sendAndConfirmTransaction`
- "Insufficient funds": Ensure wallet has enough SOL for entry fee + gas
- Network issues: Code retries up to 5 times with fresh blockhashes

### Token Validation
- "Invalid token" error: Run `npm run update-tokens` to refresh top 100 list
- Token not found: Ensure it's in CoinGecko's top 100 by market cap

## Additional Documentation

- `docs/PRD.md`: Product requirements and business logic
- `docs/context/technical-context.md`: Detailed technical specifications
- `docs/TOKEN_VALIDATION.md`: Token validation system
- `AI_SETUP.md`: AI provider configuration for mascot generation
- `VERCEL_SETUP.md`: Vercel deployment guide
