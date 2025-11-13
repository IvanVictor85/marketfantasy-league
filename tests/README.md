# Testes do Smart Contract MFL

## 📋 Arquivo de Teste Criado

✅ `tests/cryptofantasy.ts` - Testes completos do sistema de Vault

### O Que os Testes Fazem:

#### 🧪 Teste 1: `initialize_vault`
- Cria o PDA do cofre
- Verifica se a autoridade foi gravada corretamente
- Verifica se o `total_pot` começou zerado

#### 🧪 Teste 2: `deposit_entry_fee`
- Cria um jogador mock
- Faz airdrop de 1 SOL para ele
- Chama `deposit_entry_fee()`
- Verifica se o cofre recebeu 0.005 SOL

---

## 🚀 Como Rodar os Testes

### Pré-requisitos

1. **Instalar dependências do Anchor:**

```bash
cd "/d/Cultura Builder/My Projects/cryptofantasy-league"

# Instalar dependências TypeScript para testes
npm install --save-dev @coral-xyz/anchor @solana/web3.js chai mocha ts-mocha @types/mocha @types/chai
```

2. **Ter Anchor instalado:**

```bash
# Se ainda não instalou
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

---

### Opção 1: Rodar com Validator Local (Recomendado para Desenvolvimento)

```bash
# 1. Build do programa
anchor build

# 2. Rodar testes (isso vai:
#    - Iniciar um validator local
#    - Fazer deploy do contrato
#    - Executar os testes
#    - Fechar o validator)
anchor test
```

**Saída esperada:**
```
  mfl_program
Executando initialize_vault...
Endereço do Cofre (PDA): AbCdEf...
Autoridade (Admin): XyZaBc...
✅ Cofre inicializado com sucesso. Total: 0
    ✓ Deve inicializar o cofre (Vault)! (234ms)
    
Executando deposit_entry_fee...
Jogador: QwErTy...
Saldo anterior do cofre: 0
Saldo novo do cofre: 5000000
    ✓ Deve permitir que um jogador deposite a taxa de entrada! (156ms)

  2 passing (390ms)
```

---

### Opção 2: Rodar contra Devnet

```bash
# 1. Configurar Solana para Devnet
solana config set --url https://api.devnet.solana.com

# 2. Fazer airdrop para sua wallet
solana airdrop 2

# 3. Fazer deploy
anchor deploy

# 4. Rodar testes contra Devnet
anchor test --skip-local-validator
```

---

### Opção 3: Rodar apenas um teste específico

```bash
# Rodar só o teste de inicialização
anchor test --skip-local-validator -- --grep "inicializar"

# Rodar só o teste de depósito
anchor test --skip-local-validator -- --grep "deposite"
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@coral-xyz/anchor'"

```bash
npm install --save-dev @coral-xyz/anchor
```

### Erro: "Program ID mismatch"

```bash
# 1. Gerar novo keypair
anchor keys list

# 2. Copiar o ID gerado

# 3. Atualizar declare_id! em programs/cryptofantasy/src/lib.rs
declare_id!("SEU_PROGRAM_ID_AQUI");

# 4. Rebuild
anchor build
```

### Erro: "Account already exists"

O vault já foi inicializado em uma execução anterior. Opções:

**Opção A:** Rodar testes em um validator limpo:
```bash
anchor test
```

**Opção B:** Usar uma seed diferente no Rust (temporário para testes):
```rust
seeds = [b"mfl-vault-v2"],  // Mudar versão
```

### Erro: "Insufficient funds"

Sua wallet de teste não tem SOL suficiente:

```bash
# Para localnet (automático com anchor test)
anchor test

# Para devnet
solana airdrop 2
```

---

## 📊 Estrutura dos Testes

```typescript
describe("mfl_program", () => {
  // Configuração
  const provider = anchor.AnchorProvider.env();
  const program = anchor.workspace.MflProgram;
  
  // Calcular PDA (antes de existir!)
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("mfl-vault")],
    program.programId
  );
  
  // Teste 1: Initialize
  it("Deve inicializar o cofre", async () => {
    await program.methods.initializeVault()
      .accounts({ ... })
      .rpc();
  });
  
  // Teste 2: Deposit
  it("Deve depositar taxa", async () => {
    await program.methods.depositEntryFee()
      .accounts({ ... })
      .signers([player])
      .rpc();
  });
});
```

---

## 🔍 Inspecionar o Cofre On-Chain

Após rodar os testes, você pode inspecionar o cofre:

```typescript
// Adicione ao final do teste:
console.log("Endereço do Cofre:", vaultPDA.toBase58());

// Copie o endereço e use:
solana account <VAULT_ADDRESS> --url localhost  # para localnet
solana account <VAULT_ADDRESS> --url devnet     # para devnet
```

Ou via código:

```typescript
const vaultAccount = await program.account.vault.fetch(vaultPDA);
console.log("Autoridade:", vaultAccount.authority.toBase58());
console.log("Total acumulado:", vaultAccount.totalPot.toNumber() / 1_000_000_000, "SOL");
```

---

## 📝 Próximos Testes a Implementar

### Fase 2: Teste de Verificação de Entrada

```typescript
it("Deve verificar se jogador já pagou", async () => {
  const hasEntry = await program.methods.hasPaidEntry()
    .accounts({ ... })
    .view();
  
  assert.equal(hasEntry, true);
});
```

### Fase 3: Teste de Distribuição de Prêmios

```typescript
it("Deve distribuir prêmios aos vencedores", async () => {
  const winners = [
    { wallet: player1.publicKey, percentage: 5000 }, // 50%
    { wallet: player2.publicKey, percentage: 3000 }, // 30%
    { wallet: player3.publicKey, percentage: 2000 }, // 20%
  ];
  
  await program.methods.executePayout(winners)
    .accounts({ ... })
    .rpc();
});
```

---

## 🎯 Comandos Úteis

```bash
# Build
anchor build

# Testes
anchor test                              # Tudo (com validator local)
anchor test --skip-local-validator       # Contra devnet/mainnet
anchor test -- --grep "palavra"          # Filtrar por nome

# Deploy
anchor deploy                            # Deploy para cluster configurado
anchor deploy --provider.cluster devnet  # Forçar devnet

# Verificar configuração
solana config get                        # Ver cluster atual
anchor keys list                         # Ver program ID
```

---

**Última atualização:** 2025-01-04  
**Versão:** 0.1.0 (MVP - Testes Básicos)
