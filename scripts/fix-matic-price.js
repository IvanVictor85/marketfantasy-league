const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔧 Corrigindo priceStart do MATIC...\n');

    // Buscar competição ativa
    const activeComp = await prisma.competition.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!activeComp) {
      console.log('❌ Nenhuma competição ACTIVE');
      await prisma.$disconnect();
      return;
    }

    console.log('📊 Competição:', activeComp.id);

    // Buscar preço atual do POL/MATIC
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd');
    const data = await response.json();
    const maticPrice = data['matic-network']?.usd;

    if (!maticPrice) {
      console.log('❌ Não conseguiu buscar preço do MATIC');
      await prisma.$disconnect();
      return;
    }

    console.log('💰 Preço atual do MATIC:', maticPrice);

    // Atualizar MATIC na competição
    const result = await prisma.competitionToken.updateMany({
      where: {
        competitionId: activeComp.id,
        symbol: 'MATIC',
        priceStart: null
      },
      data: {
        priceStart: maticPrice
      }
    });

    console.log('\n✅ Atualizado:', result.count, 'registro(s)');

    // Verificar
    const maticToken = await prisma.competitionToken.findFirst({
      where: {
        competitionId: activeComp.id,
        symbol: 'MATIC'
      }
    });

    console.log('\n🔍 MATIC agora:');
    console.log('Symbol:', maticToken?.symbol);
    console.log('PriceStart:', maticToken?.priceStart);
    console.log('TokenId:', maticToken?.tokenId);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
