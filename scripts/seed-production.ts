import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Verificar se já existe
  const existing = await prisma.league.findFirst({
    where: { leagueType: 'MAIN' }
  });

  if (existing) {
    console.log('✅ Liga Principal já existe:', existing.id);
    console.log('   Nome:', existing.name);
    console.log('   Entry Fee:', existing.entryFee, 'SOL');
    console.log('   Participantes:', existing.participantCount);
    return;
  }

  // Criar Liga Principal
  const mainLeague = await prisma.league.create({
    data: {
      name: 'Liga Principal',
      leagueType: 'MAIN',
      entryFee: 0.5,
      maxPlayers: null,
      startDate: new Date('2025-10-20T21:00:00Z'),
      endDate: new Date('2025-12-31T09:00:00Z'),
      isActive: true,
      treasuryPda: '', // Will be set when smart contract is deployed
      adminWallet: 'ADMIN_WALLET_PLACEHOLDER', // To be configured
      protocolWallet: 'PROTOCOL_WALLET_PLACEHOLDER', // To be configured
      prizeDistribution: JSON.stringify({
        first: 0.5,
        second: 0.3,
        third: 0.2
      }),
      totalPrizePool: 0,
      participantCount: 0
    }
  });

  console.log('✅ Liga Principal criada com sucesso!');
  console.log('   ID:', mainLeague.id);
  console.log('   Nome:', mainLeague.name);
  console.log('   Entry Fee:', mainLeague.entryFee, 'SOL');
  console.log('   Data de início:', mainLeague.startDate.toISOString());
  console.log('   Data de término:', mainLeague.endDate.toISOString());
}

seed()
  .then(() => {
    console.log('\n✅ Seed concluído com sucesso!');
    return prisma.$disconnect();
  })
  .catch(err => {
    console.error('\n❌ Erro ao fazer seed:', err);
    return prisma.$disconnect().then(() => process.exit(1));
  });
