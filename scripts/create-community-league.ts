import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createCommunityLeague() {
  console.log('🌱 Criando liga Cultura Builder...');

  try {
    // Verificar se já existe
    const existing = await prisma.league.findFirst({
      where: {
        name: 'Cultura Builder',
        leagueType: 'COMMUNITY'
      }
    });

    if (existing) {
      console.log('✅ Liga Cultura Builder já existe:');
      console.log('   ID:', existing.id);
      console.log('   Nome:', existing.name);
      console.log('   Entry Fee:', existing.entryFee, 'SOL');
      console.log('   Participantes:', existing.participantCount);
      console.log('   Início:', existing.startDate);
      console.log('   Fim:', existing.endDate);
      return;
    }

    // Criar liga
    const league = await prisma.league.create({
      data: {
        name: 'Cultura Builder',
        leagueType: 'COMMUNITY',
        entryFee: 0.001, // 0.001 SOL (devnet)
        maxPlayers: 100,
        startDate: new Date('2025-10-20T02:00:00Z'), // 19/10 23h Brasil
        endDate: new Date('2025-10-21T02:00:00Z'),   // 20/10 23h Brasil
        isActive: true,
        treasuryPda: '', // Will be set when smart contract is deployed
        adminWallet: 'ADMIN_WALLET_PLACEHOLDER',
        protocolWallet: 'PROTOCOL_WALLET_PLACEHOLDER',
        prizeDistribution: JSON.stringify({
          first: 0.5,
          second: 0.3,
          third: 0.2
        }),
        totalPrizePool: 0,
        participantCount: 0
      }
    });

    console.log('✅ Liga Cultura Builder criada com sucesso!');
    console.log('   ID:', league.id);
    console.log('   Nome:', league.name);
    console.log('   Tipo:', league.leagueType);
    console.log('   Entry Fee:', league.entryFee, 'SOL');
    console.log('   Max Players:', league.maxPlayers);
    console.log('   Início:', league.startDate.toISOString(), '(19/10 23h Brasil)');
    console.log('   Fim:', league.endDate.toISOString(), '(20/10 23h Brasil)');
  } catch (error) {
    console.error('❌ Erro ao criar liga:', error);
    throw error;
  }
}

createCommunityLeague()
  .then(() => {
    console.log('\n✅ Criação concluída!');
    return prisma.$disconnect();
  })
  .catch(err => {
    console.error('\n❌ Erro fatal:', err);
    return prisma.$disconnect().then(() => process.exit(1));
  });
