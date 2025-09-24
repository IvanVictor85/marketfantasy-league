use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111112"); // Placeholder - will be updated after deployment

#[program]
pub mod cryptofantasy {
    use super::*;

    /// Creates a new fantasy league
    pub fn create_league(
        ctx: Context<CreateLeague>,
        entry_fee: u64,
        max_players: u16,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        let league = &mut ctx.accounts.league;
        let clock = Clock::get()?;

        league.admin = ctx.accounts.admin.key();
        league.protocol_treasury = ctx.accounts.protocol_treasury.key();
        league.entry_fee = entry_fee;
        league.max_players = max_players;
        league.current_players = 0;
        league.start_time = start_time;
        league.end_time = end_time;
        league.is_active = true;
        league.total_pool = 0;
        league.is_distributed = false;
        league.created_at = clock.unix_timestamp;
        league.bump = ctx.bumps.league;

        msg!("League created with entry fee: {} lamports", entry_fee);
        Ok(())
    }

    /// Allows a user to join a league by paying the entry fee
    pub fn join_league(ctx: Context<JoinLeague>) -> Result<()> {
        let league = &mut ctx.accounts.league;
        let clock = Clock::get()?;

        // Validate league is active and not full
        require!(league.is_active, ErrorCode::LeagueNotActive);
        require!(league.current_players < league.max_players, ErrorCode::LeagueFull);
        require!(clock.unix_timestamp < league.start_time, ErrorCode::LeagueAlreadyStarted);

        // Transfer entry fee from user to treasury PDA
        let transfer_instruction = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        token::transfer(cpi_ctx, league.entry_fee)?;

        // Update league state
        league.current_players += 1;
        league.total_pool += league.entry_fee;

        msg!("User {} joined league. Total players: {}", 
             ctx.accounts.user.key(), 
             league.current_players);
        Ok(())
    }

    /// Distributes prizes to winners (called by admin/oracle)
    pub fn distribute_prizes(
        ctx: Context<DistributePrizes>,
        winner1: Pubkey,
        winner2: Pubkey,
        winner3: Pubkey,
    ) -> Result<()> {
        let league = &mut ctx.accounts.league;
        let clock = Clock::get()?;

        // Validate only admin can call this
        require!(ctx.accounts.admin.key() == league.admin, ErrorCode::Unauthorized);
        require!(!league.is_distributed, ErrorCode::AlreadyDistributed);
        require!(clock.unix_timestamp > league.end_time, ErrorCode::LeagueNotEnded);

        let total_pool = league.total_pool;
        
        // Calculate prize distribution
        let first_prize = total_pool * 50 / 100;   // 50%
        let second_prize = total_pool * 20 / 100;  // 20%
        let third_prize = total_pool * 10 / 100;   // 10%
        let protocol_fee = total_pool * 20 / 100;  // 20%

        // Create seeds for PDA signing
        let league_key = league.key();
        let seeds = &[
            b"treasury",
            league_key.as_ref(),
            &[league.bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer first prize
        if first_prize > 0 {
            let transfer_ix = Transfer {
                from: ctx.accounts.treasury_token_account.to_account_info(),
                to: ctx.accounts.winner1_token_account.to_account_info(),
                authority: ctx.accounts.treasury_pda.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_ix,
                signer,
            );
            token::transfer(cpi_ctx, first_prize)?;
        }

        // Transfer second prize
        if second_prize > 0 {
            let transfer_ix = Transfer {
                from: ctx.accounts.treasury_token_account.to_account_info(),
                to: ctx.accounts.winner2_token_account.to_account_info(),
                authority: ctx.accounts.treasury_pda.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_ix,
                signer,
            );
            token::transfer(cpi_ctx, second_prize)?;
        }

        // Transfer third prize
        if third_prize > 0 {
            let transfer_ix = Transfer {
                from: ctx.accounts.treasury_token_account.to_account_info(),
                to: ctx.accounts.winner3_token_account.to_account_info(),
                authority: ctx.accounts.treasury_pda.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_ix,
                signer,
            );
            token::transfer(cpi_ctx, third_prize)?;
        }

        // Transfer protocol fee
        if protocol_fee > 0 {
            let transfer_ix = Transfer {
                from: ctx.accounts.treasury_token_account.to_account_info(),
                to: ctx.accounts.protocol_token_account.to_account_info(),
                authority: ctx.accounts.treasury_pda.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_ix,
                signer,
            );
            token::transfer(cpi_ctx, protocol_fee)?;
        }

        league.is_distributed = true;
        league.is_active = false;

        msg!("Prizes distributed - 1st: {}, 2nd: {}, 3rd: {}, Protocol: {}", 
             first_prize, second_prize, third_prize, protocol_fee);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateLeague<'info> {
    #[account(
        init,
        payer = admin,
        space = League::LEN,
        seeds = [b"league", admin.key().as_ref()],
        bump
    )]
    pub league: Account<'info, League>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// CHECK: Protocol treasury wallet address
    pub protocol_treasury: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinLeague<'info> {
    #[account(mut)]
    pub league: Account<'info, League>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DistributePrizes<'info> {
    #[account(mut)]
    pub league: Account<'info, League>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// CHECK: Treasury PDA for signing transfers
    #[account(
        seeds = [b"treasury", league.key().as_ref()],
        bump = league.bump
    )]
    pub treasury_pda: AccountInfo<'info>,
    
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub winner1_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub winner2_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub winner3_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub protocol_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct League {
    pub admin: Pubkey,              // 32
    pub protocol_treasury: Pubkey,  // 32
    pub entry_fee: u64,             // 8
    pub max_players: u16,           // 2
    pub current_players: u16,       // 2
    pub start_time: i64,            // 8
    pub end_time: i64,              // 8
    pub is_active: bool,            // 1
    pub total_pool: u64,            // 8
    pub is_distributed: bool,       // 1
    pub created_at: i64,            // 8
    pub bump: u8,                   // 1
}

impl League {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 2 + 2 + 8 + 8 + 1 + 8 + 1 + 8 + 1; // 119 bytes
}

#[error_code]
pub enum ErrorCode {
    #[msg("League is not active")]
    LeagueNotActive,
    #[msg("League is full")]
    LeagueFull,
    #[msg("League has already started")]
    LeagueAlreadyStarted,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Prizes already distributed")]
    AlreadyDistributed,
    #[msg("League has not ended yet")]
    LeagueNotEnded,
}