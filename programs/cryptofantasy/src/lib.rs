// Conteúdo para: src/lib.rs

use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

// 1. ID do Programa (Placeholder - será atualizado após deploy)
declare_id!("7QHMrTeoLTggAy11kTTEwtoRzcvK8rEeY1TRu4oUdgGP");

// ===================================================================
// PROGRAMA PRINCIPAL (MFL)
// ===================================================================
#[program]
pub mod mfl_program {
    use super::*;

    // Constante para a taxa de entrada (0.01 SOL = 10,000,000 Lamports)
    const ENTRY_FEE_LAMPORTS: u64 = 10_000_000;

    /**
     * Função 1: Initialize Vault (ADMIN)
     * Cria o PDA do cofre principal do MFL.
     */
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        msg!("Inicializando o cofre MFL...");

        // Grava quem é a autoridade (o admin que criou)
        ctx.accounts.vault.authority = ctx.accounts.authority.key();
        // Zera o total de prêmios
        ctx.accounts.vault.total_pot = 0;

        msg!("Cofre inicializado. Autoridade: {}", ctx.accounts.vault.authority);
        Ok(())
    }

    /**
     * Função 2: Deposit Entry Fee (JOGADOR)
     * O jogador paga a taxa de 0.01 SOL para o cofre.
     */
    pub fn deposit_entry_fee(ctx: Context<DepositEntryFee>) -> Result<()> {
        msg!("Recebendo depósito de 0.01 SOL...");

        // 1. Preparar a transferência de SOL
        let cpi_accounts = Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // 2. Executar a transferência (chamando o programa do sistema Solana)
        system_program::transfer(cpi_ctx, ENTRY_FEE_LAMPORTS)?;

        // 3. Atualizar o total no cofre
        ctx.accounts.vault.total_pot = ctx
            .accounts
            .vault
            .total_pot
            .checked_add(ENTRY_FEE_LAMPORTS)
            .ok_or(ErrorCode::Overflow)?; // Proteção contra overflow

        msg!("Depósito recebido! Novo total do cofre: {}", ctx.accounts.vault.total_pot);
        Ok(())
    }
}

// ===================================================================
// DEFINIÇÕES DAS CONTAS (O "MOLDE" DO COFRE)
// ===================================================================

/**
 * Conta do Cofre (Vault)
 * Este é o PDA que armazena os fundos
 */
#[account]
pub struct Vault {
    pub authority: Pubkey, // A chave (admin) que pode sacar os prêmios
    pub total_pot: u64,    // O total de SOL acumulado (em lamports)
}

// ===================================================================
// CONTEXTOS DAS FUNÇÕES (A "LISTA DE ITENS" QUE CADA FUNÇÃO PRECISA)
// ===================================================================

/**
 * Contexto para `initialize_vault`
 */
#[derive(Accounts)]
pub struct InitializeVault<'info> {
    // 1. A conta do cofre (PDA) que estamos criando
    // O Anchor cuida de criar este PDA usando a "seed" (semente)
    #[account(
        init, // 'init' = inicializar esta conta
        payer = authority, // Quem paga pelo aluguel da conta é a 'authority'
        space = 8 + 32 + 8, // 8 (discriminator) + 32 (Pubkey) + 8 (u64)
        seeds = [b"mfl-vault"], // A "semente" do nosso PDA. O endereço será derivado disto.
        bump
    )]
    pub vault: Account<'info, Vault>,

    // 2. O admin (nós) que está chamando a função
    #[account(mut)]
    pub authority: Signer<'info>,

    // 3. O Programa do Sistema Solana (necessário para criar contas)
    pub system_program: Program<'info, System>,
}

/**
 * Contexto para `deposit_entry_fee`
 */
#[derive(Accounts)]
pub struct DepositEntryFee<'info> {
    // 1. O cofre (PDA) que receberá o dinheiro
    // 'mut' = mutável (porque vamos alterar o 'total_pot')
    // A 'seed' deve ser a mesma da inicialização
    #[account(
        mut,
        seeds = [b"mfl-vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,

    // 2. O jogador que está pagando a taxa
    // 'mut' = mutável (o SOL sairá dele)
    // 'signer' = ele deve assinar (provar que é ele)
    #[account(mut)]
    pub user: Signer<'info>,

    // 3. O Programa do Sistema Solana (necessário para transferir SOL)
    pub system_program: Program<'info, System>,
}

// ===================================================================
// ERROS CUSTOMIZADOS
// ===================================================================
#[error_code]
pub enum ErrorCode {
    #[msg("Overflow ao adicionar ao cofre.")]
    Overflow,
}
