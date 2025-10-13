import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initMainLeague() {
  try {
    console.log('🚀 Inicializando Liga Principal...')

    // Verificar se a Liga Principal já existe
    const existingLeague = await prisma.league.findFirst({
      where: { leagueType: 'MAIN' }
    })

    if (existingLeague) {
      console.log('✅ Liga Principal já existe:', existingLeague.name)
      return existingLeague
    }

    // Criar a Liga Principal
    const mainLeague = await prisma.league.create({
      data: {
        name: 'Liga Principal',
        leagueType: 'MAIN',
        entryFee: 0.005, // 0.005 SOL
        maxPlayers: null, // Unlimited
        startDate: new Date(), // Starts immediately
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
        treasuryPda: process.env.MAIN_LEAGUE_TREASURY_PDA || 'PLACEHOLDER_PDA',
        programId: process.env.MAIN_LEAGUE_PROGRAM_ID || null,
        adminWallet: process.env.MAIN_LEAGUE_ADMIN_WALLET || 'PLACEHOLDER_ADMIN',
        protocolWallet: process.env.MAIN_LEAGUE_PROTOCOL_WALLET || 'PLACEHOLDER_PROTOCOL',
        emblemUrl: '/league-logos/main-league.svg',
        description: 'Liga Principal do CryptoFantasy - Competição mensal de tokens',
        status: 'ACTIVE',
        badgeUrl: '/league-logos/main-league-badge.svg',
        bannerUrl: '/league-logos/main-league-banner.svg',
        prizeDistribution: JSON.stringify({
          first: 50,
          second: 30,
          third: 20
        }),
        totalPrizePool: 0,
        participantCount: 0
      }
    })

    console.log('✅ Liga Principal criada com sucesso!')
    console.log('📊 Detalhes:', {
      id: mainLeague.id,
      name: mainLeague.name,
      entryFee: `${mainLeague.entryFee} SOL`,
      startDate: mainLeague.startDate.toISOString(),
      endDate: mainLeague.endDate.toISOString()
    })

    return mainLeague
  } catch (error) {
    console.error('❌ Erro ao inicializar Liga Principal:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initMainLeague()
    .then(() => {
      console.log('🎉 Inicialização concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Falha na inicialização:', error)
      process.exit(1)
    })
}

export { initMainLeague }