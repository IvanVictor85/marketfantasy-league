# MFL Smart Contract (Vault System)

## 📋 O Que Foi Criado

Este é o **Smart Contract principal do Market Fantasy League (MFL)**, implementado usando o framework **Anchor** em Rust.

### Arquitetura: Sistema de Vault (Cofre)

O contrato implementa um **cofre descentralizado (PDA)** que gerencia:
- ✅ Taxas de entrada dos jogadores (0.005 SOL)
- ✅ Pool de prêmios acumulado
- ✅ Distribuição de prêmios aos vencedores (futuro)

---

## 🏗️ Estrutura do Código

### 1. **Conta Vault (PDA)**
```rust
pub struct Vault {
    pub authority: Pubkey,  // Admin que pode distribuir prêmios
    pub total_pot: u64,     // Total acumulado em lamports
}
```

### 2. **Funções Implementadas**

#### ✅ `initialize_vault` (ADMIN)
- **Quem chama:** Backend/Admin
- **O que faz:** Cria o PDA do cofre pela primeira vez
- **Seed:** `b"mfl-vault"`
- **Authority:** Gravada permanentemente no cofre

#### ✅ `deposit_entry_fee` (JOGADOR)
- **Quem chama:** Frontend (qualquer jogador)
- **O que faz:**
  1. Transfere 0.005 SOL (5,000,000 lamports) da carteira do jogador para o vault
  2. Atualiza o `total_pot` com proteção contra overflow
  3. Emite logs da transação

### 3. **Constantes**
```rust
const ENTRY_FEE_LAMPORTS: u64 = 5_000_000;  // 0.005 SOL
```

### 4. **Segurança**
- ✅ Proteção contra overflow matemático (`checked_add`)
- ✅ Validação de signers (quem assina deve ser o dono da carteira)
- ✅ PDA determinístico (endereço sempre o mesmo)

---

## 🚀 Próximos Passos

### Fase 2: Implementar Verificação de Entrada

Criar uma nova conta PDA para rastrear quem já pagou:

```rust
#[account]
pub struct PlayerEntry {
    pub player: Pubkey,
    pub league_id: u64,
    pub paid_at: i64,
}

// Seed: [b"entry", user.key(), league_id.to_le_bytes()]
```

**Nova função:**
```rust
pub fn has_paid_entry(ctx: Context<CheckEntry>) -> Result<bool>
```

### Fase 3: Distribuição de Prêmios

```rust
pub fn execute_payout(
    ctx: Context<ExecutePayout>,
    winners: Vec<(Pubkey, u64)>,  // (wallet, lamports)
) -> Result<()>
```

Proteções necessárias:
- Verificar assinatura da authority
- Evitar reentrancy
- Validar saldo suficiente
- Histórico de pagamentos

---

## 🔧 Como Desenvolver Localmente

### Pré-requisitos

1. **Instalar Rust:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. **Instalar Solana CLI:**
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

3. **Instalar Anchor:**
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Gerar Program ID

```bash
cd /d/Cultura\ Builder/My\ Projects/cryptofantasy-league
anchor keys list
```

Isso vai gerar um ID como: `AbCdEf...`

### Atualizar o declare_id!

Copie o ID gerado e atualize em `programs/cryptofantasy/src/lib.rs`:

```rust
declare_id!("SEU_PROGRAM_ID_AQUI");
```

### Build do Programa

```bash
anchor build
```

### Deploy para Devnet

```bash
# 1. Configurar para devnet
solana config set --url https://api.devnet.solana.com

# 2. Criar uma wallet (se não tiver)
solana-keygen new

# 3. Airdrop de SOL de teste
solana airdrop 2

# 4. Deploy
anchor deploy
```

### Rodar Testes

```bash
anchor test
```

---

## 📊 Endereço do PDA (Vault)

O endereço do vault é **determinístico** e sempre será o mesmo:

```typescript
// Frontend: Como calcular o endereço do vault
import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('SEU_PROGRAM_ID');
const [vaultPda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from('mfl-vault')],
  PROGRAM_ID
);

console.log('Vault PDA:', vaultPda.toBase58());
```

---

## 🔗 Integração com Frontend

### 1. Inicializar o Vault (Uma única vez - Admin)

```typescript
import * as anchor from '@coral-xyz/anchor';

const tx = await program.methods
  .initializeVault()
  .accounts({
    vault: vaultPda,
    authority: adminWallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 2. Depositar Taxa de Entrada (Jogadores)

```typescript
const tx = await program.methods
  .depositEntryFee()
  .accounts({
    vault: vaultPda,
    user: playerWallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log('Depósito confirmado:', tx);
```

### 3. Verificar Saldo do Vault

```typescript
const vaultAccount = await program.account.vault.fetch(vaultPda);
console.log('Total no cofre:', vaultAccount.totalPot / 1_000_000_000, 'SOL');
console.log('Autoridade:', vaultAccount.authority.toBase58());
```

---

## 📁 Estrutura de Arquivos

```
programs/cryptofantasy/
├── Cargo.toml              # Dependências Rust
├── src/
│   ├── lib.rs              # ✅ Código principal do contrato
│   └── lib.rs.backup       # Backup do código anterior
└── README.md               # Esta documentação
```

---

## 🔐 Segurança

### Boas Práticas Implementadas:

1. ✅ **Checked Math**: Proteção contra overflow
2. ✅ **PDA Seeds**: Endereços determinísticos
3. ✅ **Signer Validation**: Apenas donos das carteiras podem assinar
4. ✅ **Space Calculation**: Tamanho exato da conta (evita desperdício de SOL)

### A Implementar:

- ⚠️ **Reentrancy Protection** (quando implementar `execute_payout`)
- ⚠️ **Timelock** para emergências
- ⚠️ **Event Logs** para auditoria
- ⚠️ **Access Control** mais granular

---

## 🐛 Troubleshooting

### Erro: "Program ID mismatch"
```bash
# Regerar keypair e atualizar declare_id!
anchor keys sync
```

### Erro: "Insufficient funds"
```bash
# Fazer airdrop de SOL de teste
solana airdrop 2
```

### Erro: "Account already exists"
```bash
# O vault já foi inicializado
# Você pode usar anchor test --skip-local-validator para testar sem reinicializar
```

---

## 📞 Contato

Para dúvidas sobre o contrato, consulte:
- Documentação Anchor: https://www.anchor-lang.com/
- Solana Cookbook: https://solanacookbook.com/

---

**Última atualização:** 2025-01-04
**Versão:** 0.1.0 (MVP - Vault Básico)
