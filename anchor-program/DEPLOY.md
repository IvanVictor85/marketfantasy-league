# MFL Program - Deploy Instructions

## Pré-requisitos

1. **Instalar Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Instalar Solana CLI**:
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.18.18/install)"
   ```

3. **Instalar Anchor CLI**:
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   ```

## Configurar Wallet

1. **Criar/usar keypair existente**:
   ```bash
   # Usar a keypair que você quer como ADMIN (3xS4Ftj8mUSg6HJcrEB95YZvj4LUtNVKSyY3MzGGDTKG)
   # Se você tem a private key em Base58, converta para JSON:

   # Ou crie uma nova:
   solana-keygen new --outfile ~/.config/solana/id.json
   ```

2. **Configurar para devnet**:
   ```bash
   solana config set --url devnet
   solana config set --keypair ~/.config/solana/id.json
   ```

3. **Verificar endereço**:
   ```bash
   solana address
   # Deve mostrar: 3xS4Ftj8mUSg6HJcrEB95YZvj4LUtNVKSyY3MzGGDTKG (seu admin)
   ```

4. **Obter SOL para deploy** (devnet):
   ```bash
   solana airdrop 2
   ```

## Deploy do Programa

1. **Navegar para a pasta do projeto**:
   ```bash
   cd anchor-program
   ```

2. **Build do programa**:
   ```bash
   anchor build
   ```

3. **Obter o novo Program ID**:
   ```bash
   solana address -k target/deploy/mfl_program-keypair.json
   ```

   Copie este endereço (ex: `AbC123...`)

4. **Atualizar o Program ID**:

   Edite `programs/mfl_program/src/lib.rs`:
   ```rust
   declare_id!("SEU_NOVO_PROGRAM_ID_AQUI");
   ```

   Edite `Anchor.toml`:
   ```toml
   [programs.devnet]
   mfl_program = "SEU_NOVO_PROGRAM_ID_AQUI"
   ```

5. **Rebuild e Deploy**:
   ```bash
   anchor build
   anchor deploy
   ```

6. **Verificar deploy**:
   ```bash
   solana program show SEU_NOVO_PROGRAM_ID
   ```

## Inicializar o Vault

Após o deploy, você precisa inicializar o vault. Crie um script ou use o Anchor:

```bash
# Via Anchor test (crie um teste que chama initialize_vault)
anchor test --skip-local-validator
```

Ou use um script TypeScript separado.

## Atualizar o Frontend

1. **No Vercel**, atualize:
   - `NEXT_PUBLIC_PROGRAM_ID` = novo program ID

2. **Atualize o IDL** em `src/lib/idl/mfl_program.json`:
   - Copie o novo IDL de `target/idl/mfl_program.json`
   - Atualize o campo `"address"` para o novo program ID

## Verificação Final

Acesse `/api/vault/info` e verifique:
- `programId` = novo program ID
- `vault.exists` = true (após inicializar)
- `admin.matchesVaultAuthority` = true

## Troubleshooting

### "Insufficient funds"
```bash
solana airdrop 2
```

### "Program already exists"
O programa é único. Cada deploy cria um novo program ID.

### "Account already initialized"
O vault PDA já existe. Se quiser reinicializar, precisa usar um novo programa.
