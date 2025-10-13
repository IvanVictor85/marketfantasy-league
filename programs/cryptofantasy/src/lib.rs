use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("11111111111111111111111111111112"); // Placeholder - will be updated after deployment

#[program]
pub mod cryptofantasy {
    use super::*;

    /// Initializes the Main League (Liga Principal)
    pub fn initialize_league(
        ctx: Context<InitializeLeague>,
        entry_fee: u64,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        let league = &mut ctx.accounts.league;
        let clock = Clock::get()?;

        league.admin = ctx.accounts.admin.key();
        league.protocol_treasury = ctx.accounts.protocol_treasury.key();
        league.entry_fee = entry_fee; // 0.005 SOL = 5_000_000 lamports
        league.max_players = None; // Unlimited for Main League
        league.current_players = 0;
        league.start_time = start_time;
        league.end_time = end_time;
        league.is_active = true;
        league.total_pool = 0;
        league.is_distributed = false;
        league.created_at = clock.unix_timestamp;
        league.bump = ctx.bumps.league;
        league.league_type = LeagueType::Main;

        msg!("Main League initialized with entry fee: {} lamports", entry_fee);
        Ok(())
    }

    /// Allows a user to enter the Main League by paying the entry fee in SOL
    pub fn enter_league(ctx: Context<EnterLeague>) -> Result<()> {
        let league = &mut ctx.accounts.league;
        let clock = Clock::get()?;

        // Validate league is active
        require!(league.is_active, ErrorCode::LeagueNotActive);
        require!(clock.unix_timestamp < league.end_time, ErrorCode::LeagueEnded);

        // For Main League, no player limit
        if let Some(max_players) = league.max_players {
            require!(league.current_players < max_players, ErrorCode::LeagueFull);
        }

        // Transfer entry fee from user to treasury PDA
        let transfer_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.treasury_pda.to_account_info(),
            },
        );
        system_program::transfer(transfer_ctx, league.entry_fee)?;

        // Update league state
        league.current_players += 1;
        league.total_pool += league.entry_fee;

        msg!("User {} entered league. Total players: {}, Total pool: {} lamports", 
             ctx.accounts.user.key(), 
             league.current_players,
             league.total_pool);
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
        
        // Calculate prize distribution (50%, 30%, 20%)
        let first_prize = total_pool * 50 / 100;   // 50%
        let second_prize = total_pool * 30 / 100;  // 30%
        let third_prize = total_pool * 20 / 100;   // 20%

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
            **ctx.accounts.treasury_pda.to_account_info().try_borrow_mut_lamports()? -= first_prize;
            **ctx.accounts.winner1.to_account_info().try_borrow_mut_lamports()? += first_prize;
        }

        // Transfer second prize
        if second_prize > 0 {
            **ctx.accounts.treasury_pda.to_account_info().try_borrow_mut_lamports()? -= second_prize;
            **ctx.accounts.winner2.to_account_info().try_borrow_mut_lamports()? += second_prize;
        }

        // Transfer third prize
        if third_prize > 0 {
            **ctx.accounts.treasury_pda.to_account_info().try_borrow_mut_lamports()? -= third_prize;
            **ctx.accounts.winner3.to_account_info().try_borrow_mut_lamports()? += third_prize;
        }

        league.is_distributed = true;

        msg!("Prizes distributed: 1st: {} lamports, 2nd: {} lamports, 3rd: {} lamports", 
             first_prize, second_prize, third_prize);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeLeague<'info> {
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
pub struct EnterLeague<'info> {
    #[account(mut)]
    pub league: Account<'info, League>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"treasury", league.key().as_ref()],
        bump = league.bump
    )]
    /// CHECK: Treasury PDA for holding entry fees
    pub treasury_pda: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributePrizes<'info> {
    #[account(mut)]
    pub league: Account<'info, League>,

    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"treasury", league.key().as_ref()],
        bump = league.bump
    )]
    /// CHECK: Treasury PDA for holding entry fees
    pub treasury_pda: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: First place winner wallet
    pub winner1: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Second place winner wallet
    pub winner2: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Third place winner wallet
    pub winner3: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct League {
    pub admin: Pubkey,              // 32
    pub protocol_treasury: Pubkey,  // 32
    pub entry_fee: u64,             // 8
    pub max_players: Option<u16>,   // 1 + 2 = 3 (Option enum)
    pub current_players: u16,       // 2
    pub start_time: i64,            // 8
    pub end_time: i64,              // 8
    pub is_active: bool,            // 1
    pub total_pool: u64,            // 8
    pub is_distributed: bool,       // 1
    pub created_at: i64,            // 8
    pub bump: u8,                   // 1
    pub league_type: LeagueType,    // 1
}

impl League {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 3 + 2 + 8 + 8 + 1 + 8 + 1 + 8 + 1 + 1; // 121 bytes
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum LeagueType {
    Main,
    Community,
}

#[error_code]
pub enum ErrorCode {
    #[msg("League is not active")]
    LeagueNotActive,
    #[msg("League is full")]
    LeagueFull,
    #[msg("League has ended")]
    LeagueEnded,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Prizes already distributed")]
    AlreadyDistributed,
    #[msg("League has not ended yet")]
    LeagueNotEnded,
}