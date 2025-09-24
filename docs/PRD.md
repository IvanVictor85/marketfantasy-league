# PRD - CryptoFantasy League

## Visão Geral
Um dApp de fantasy game onde usuários conectam carteiras Solana, montam times de 10 criptoativos, competem em ligas pagas e ganham prêmios baseados na performance dos tokens durante a semana de competição (Domingo 21h a Sexta-feira 21h).

## Objetivos
- Objetivo principal: Criar um protótipo funcional de dApp para hackathon que demonstre integração entre frontend moderno e smart contracts Solana
- Objetivos secundários: Implementar modelo de negócio sustentável com distribuição automática de prêmios e taxa de protocolo

## Público-Alvo
Traders de criptomoedas, entusiastas de DeFi e jogadores de fantasy sports que querem combinar estratégia com investimentos cripto.

## Funcionalidades Core
1. **Conexão de Carteira Solana**: Integração com Phantom, Solflare e outras carteiras via @solana/wallet-adapter
2. **Sistema de Ligas**: Criação e participação em ligas com taxa de entrada (SOL/USDC)
3. **Montagem de Times**: Interface drag-and-drop para selecionar 10 criptoativos em formação 4-3-3
4. **Distribuição Automática**: Smart contract distribui prêmios automaticamente (50% 1º, 20% 2º, 10% 3º, 20% protocolo)
5. **Cálculo de Performance**: Sistema off-chain calcula ranking baseado na performance dos tokens

## Requisitos Técnicos
- Framework: Next.js 15.x com App Router
- UI: Shadcn/ui + Tailwind CSS
- Linguagem: TypeScript
- Blockchain: Solana (Devnet para desenvolvimento)
- Smart Contracts: Rust + Anchor Framework
- Autenticação: Carteira Solana via @solana/wallet-adapter
- Dados: Prisma + SQLite para dados off-chain, CoinGecko API para preços
- Deploy: Vercel (frontend) + Solana Devnet (smart contracts)

## Arquitetura Web3
### Frontend (Next.js)
- **Páginas principais**: Home, Leagues, Team Builder, Dashboard
- **Componentes**: WalletMultiButton, LeagueCard, TokenSelector, TeamFormation
- **API Routes**: /api/team (salvar escalação), /api/cron/calculate-winners (oráculo)

### Smart Contract (Solana/Anchor)
- **Accounts**: League (estado da liga), Treasury PDA (cofre de prêmios)
- **Instructions**: 
  - `create_league(entry_fee, protocol_treasury)`
  - `join_league()` 
  - `distribute_prizes(winner1, winner2, winner3)`

### Lógica Off-Chain
- **Oráculo**: Next.js API Routes calculam vencedores e acionam distribuição
- **Database**: SQLite armazena escalações dos usuários
- **Integração**: CoinGecko API para preços em tempo real

## Requisitos de Segurança (OWASP Top 10)
1. **Broken Access Control**: Implementar RBAC e validação de permissões no smart contract
2. **Cryptographic Failures**: HTTPS obrigatório, dados sensíveis criptografados
3. **Injection**: Validação e sanitização de inputs, prepared statements
4. **Insecure Design**: Threat modeling, princípio do menor privilégio
5. **Security Misconfiguration**: Headers de segurança, CORS configurado
6. **Vulnerable Components**: Auditoria regular de dependências
7. **Authentication Failures**: Rate limiting, validação de assinatura de carteira
8. **Data Integrity Failures**: Validação de serialização, verificação de integridade
9. **Security Logging**: Logs de transações, monitoramento de eventos
10. **SSRF**: Validação de URLs, whitelist de domínios para APIs externas

## Modelo de Negócio
- **Taxa de Entrada**: Usuários pagam SOL/USDC para entrar nas ligas
- **Distribuição de Prêmios**: 
  - 1º Lugar: 50% do pool
  - 2º Lugar: 20% do pool  
  - 3º Lugar: 10% do pool
  - Protocolo: 20% do pool (receita sustentável)

## Métricas de Sucesso
- Performance: LCP < 2.5s, FID < 100ms
- Segurança: 0 vulnerabilidades críticas
- Funcionalidade: 100% das transações executadas com sucesso
- UX: Interface responsiva e intuitiva para Web3

## Roadmap de Desenvolvimento (Hackathon)
1. **Fase 1**: Setup e estrutura base (✅ Concluído)
2. **Fase 2**: Smart contract Anchor + testes
3. **Fase 3**: Frontend com integração de carteira
4. **Fase 4**: API Routes e lógica de oráculo
5. **Fase 5**: UI/UX polido e deploy final