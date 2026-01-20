/**
 * 🔧 ADICIONAR DASH À RODADA 4
 *
 * Cria o registro faltante de DASH em CompetitionToken e PriceHistory
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodada4Id = 'cmicalux3000810oueqd2dkax';

async function addDashToRodada4() {
  console.log('\n🔧 ADICIONANDO DASH À RODADA 4\n');
  console.log('='.repeat(80));

  try {
    // 1. Verificar se DASH já existe (segurança)
    const existing = await prisma.competitionToken.findFirst({
      where: {
        competitionId: rodada4Id,
        symbol: 'DASH'
      }
    });

    if (existing) {
      console.log('⚠️  DASH já existe em CompetitionToken!');
      console.log(`   Price Start: ${existing.priceStart}`);
      console.log(`   Price Start Date: ${existing.priceStartDate}`);
      await prisma.$disconnect();
      return;
    }

    console.log('✅ DASH confirmado como faltante, prosseguindo...\n');

    // 2. Buscar competição para pegar a data de início
    const competition = await prisma.competition.findUnique({
      where: { id: rodada4Id }
    });

    if (!competition) {
      console.error('❌ Rodada 4 não encontrada!');
      await prisma.$disconnect();
      return;
    }

    console.log(`📅 Rodada 4: ${competition.name}`);
    console.log(`   Status: ${competition.status}`);
    console.log(`   Start Date: ${competition.startDate}`);
    console.log('');

    // 3. Buscar preço atual do DASH da API
    console.log('📡 Buscando preço do DASH da API...\n');

    const response = await fetch('http://localhost:3000/api/market?ids=dash');

    if (!response.ok) {
      console.error(`❌ Erro ao buscar DASH da API: ${response.status}`);
      await prisma.$disconnect();
      return;
    }

    const data = await response.json();
    const dashData = Array.isArray(data) ? data[0] : data.tokens?.[0];

    if (!dashData) {
      console.error('❌ DASH não retornado pela API!');
      await prisma.$disconnect();
      return;
    }

    console.log('✅ Dados do DASH obtidos:');
    console.log(`   Preço atual: $${dashData.currentPrice}`);
    console.log(`   Variação 7d: ${dashData.priceChange7d}%`);
    console.log('');

    // 4. Criar registro em CompetitionToken
    console.log('💾 Criando registro em CompetitionToken...\n');

    const competitionToken = await prisma.competitionToken.create({
      data: {
        competitionId: rodada4Id,
        tokenId: dashData.id || 'dash',  // ID da CoinGecko
        symbol: 'DASH',
        name: dashData.name || 'Dash',
        imageUrl: dashData.image || dashData.logoUrl || '',
        marketCapRank: dashData.marketCapRank || null,
        priceStart: dashData.currentPrice,
        priceStartDate: competition.startDate
      }
    });

    console.log('✅ CompetitionToken criado:');
    console.log(`   ID: ${competitionToken.id}`);
    console.log(`   Symbol: ${competitionToken.symbol}`);
    console.log(`   Price Start: $${competitionToken.priceStart}`);
    console.log(`   Price Start Date: ${competitionToken.priceStartDate}`);
    console.log('');

    // 5. Criar registro em PriceHistory
    console.log('💾 Criando registro em PriceHistory...\n');

    const priceHistory = await prisma.priceHistory.create({
      data: {
        tokenSymbol: 'DASH',
        price: dashData.currentPrice,
        timestamp: competition.startDate,
        source: `competition_start_${rodada4Id}`
      }
    });

    console.log('✅ PriceHistory criado:');
    console.log(`   ID: ${priceHistory.id}`);
    console.log(`   Token: ${priceHistory.tokenSymbol}`);
    console.log(`   Preço: $${priceHistory.price}`);
    console.log(`   Source: ${priceHistory.source}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('\n✅ DASH adicionado com sucesso à Rodada 4!');
    console.log('\n💡 Agora DASH deve aparecer corretamente no dashboard.\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDashToRodada4();
