use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("KFbqeVcH7WemKHghyjdFByDpKSJQarWr378oK2ASfR5");

#[program]
pub mod mfl_program {
    use super::*;

    /// Função 1: Initialize Vault (ADMIN)
    /// Cria o PDA do cofre principal do MFL.
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.total_pot = 0;

        msg!("Vault initialized with authority: {}", vault.authority);
        Ok(())
    }

    /// Função 2: Deposit Entry Fee (JOGADOR)
    /// O jogador paga a taxa de 0.025 SOL para o cofre.
    pub fn deposit_entry_fee(ctx: Context<DepositEntryFee>) -> Result<()> {
        let entry_fee: u64 = 25_000_000; // 0.025 SOL in lamports

        // Transfer SOL from user to vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, entry_fee)?;

        // Update vault total
        let vault = &mut ctx.accounts.vault;
        vault.total_pot = vault.total_pot
            .checked_add(entry_fee)
            .ok_or(MflError::Overflow)?;

        msg!("Entry fee deposited: {} lamports. Total pot: {}", entry_fee, vault.total_pot);
        Ok(())
    }

    /// Função 3: Claim Prize (ADMIN)
    /// Distribui prêmio do cofre para o vencedor.
    /// Apenas a autoridade (admin) pode chamar esta função.
    pub fn claim_prize(ctx: Context<ClaimPrize>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        // Verify authority
        require!(
            vault.authority == ctx.accounts.authority.key(),
            MflError::Unauthorized
        );

        // Check sufficient funds (use actual lamports balance)
        let vault_balance = vault.to_account_info().lamports();
        require!(
            vault_balance >= amount,
            MflError::InsufficientFunds
        );

        // Update total_pot (saturating sub to avoid underflow when SOL was sent directly)
        vault.total_pot = vault.total_pot.saturating_sub(amount);

        // Transfer SOL from vault to winner
        **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += amount;

        msg!("Prize claimed: {} lamports to {}. Remaining balance: {}",
            amount, ctx.accounts.winner.key(), vault_balance - amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8, // discriminator + pubkey + u64
        seeds = [b"mfl-vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositEntryFee<'info> {
    #[account(
        mut,
        seeds = [b"mfl-vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(
        mut,
        seeds = [b"mfl-vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,

    /// CHECK: Winner account, just receives SOL
    #[account(mut)]
    pub winner: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Conta do Cofre (Vault)
/// Este é o PDA que armazena os fundos
#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub total_pot: u64,
}

#[error_code]
pub enum MflError {
    #[msg("Overflow ao adicionar ao cofre.")]
    Overflow,
    #[msg("Underflow ao subtrair do cofre.")]
    Underflow,
    #[msg("Saldo insuficiente no cofre.")]
    InsufficientFunds,
    #[msg("Não autorizado. Apenas o admin pode distribuir prêmios.")]
    Unauthorized,
}
