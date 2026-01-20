const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMatic() {
  const tokens = await prisma.competitionToken.findMany({
    where: {
      competitionId: 'cmicalugq000210ou5ri809wa',
      OR: [
        { symbol: 'MATIC' },
        { symbol: 'POL' }
      ]
    },
    select: {
      symbol: true,
      tokenId: true,
      priceStart: true,
      priceStartDate: true
    }
  });

  console.log('MATIC/POL tokens:', JSON.stringify(tokens, null, 2));

  await prisma.$disconnect();
}

checkMatic();
