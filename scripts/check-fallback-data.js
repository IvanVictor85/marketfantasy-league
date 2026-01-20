const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFallbackData() {
  console.log('🔍 Verificando qualidade dos dados de fallback no banco...\n');

  try {
    // Buscar competição ativa
    const competition = await prisma.competition.findFirst({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'ACTIVE' }
        ]
      },
      orderBy: {
        startDate: 'desc'
      },
      include: {
        competitionTokens: true
      }
    });

    if (!competition) {
      console.log('❌ Nenhuma competição ativa encontrada');
      await prisma.$disconnect();
      return;
    }

    console.log(`📅 Competição: ${competition.id}`);
    console.log(`🔒 Status: ${competition.status}`);
    console.log(`📊 Total de tokens: ${competition.competitionTokens.length}\n`);

    // Analisar qualidade dos dados
    let tokensWithPrice = 0;
    let tokensWithoutPrice = 0;
    let tokensWithImage = 0;
    let tokensWithoutImage = 0;
    let tokensWithMarketCap = 0;

    const problematicTokens = [];

    competition.competitionTokens.forEach(token => {
      // Verificar preço
      if (token.currentPrice && token.currentPrice > 0) {
        tokensWithPrice++;
      } else {
        tokensWithoutPrice++;
        problematicTokens.push({
          symbol: token.symbol,
          name: token.name,
          issue: 'Sem preço'
        });
      }

      // Verificar imagem
      if (token.imageUrl) {
        tokensWithImage++;
      } else {
        tokensWithoutImage++;
      }

      // Verificar market cap
      if (token.marketCap && token.marketCap > 0) {
        tokensWithMarketCap++;
      }
    });

    // Exibir estatísticas
    console.log('📊 ESTATÍSTICAS DOS DADOS DE FALLBACK:');
    console.log(`   ✅ Tokens com preço: ${tokensWithPrice}/${competition.competitionTokens.length}`);
    console.log(`   ❌ Tokens SEM preço: ${tokensWithoutPrice}/${competition.competitionTokens.length}`);
    console.log(`   🖼️  Tokens com imagem: ${tokensWithImage}/${competition.competitionTokens.length}`);
    console.log(`   ❌ Tokens SEM imagem: ${tokensWithoutImage}/${competition.competitionTokens.length}`);
    console.log(`   💰 Tokens com market cap: ${tokensWithMarketCap}/${competition.competitionTokens.length}\n`);

    // Mostrar tokens problemáticos
    if (problematicTokens.length > 0) {
      console.log('⚠️ TOKENS PROBLEMÁTICOS (sem preço):');
      problematicTokens.forEach(token => {
        console.log(`   ❌ ${token.symbol} (${token.name}) - ${token.issue}`);
      });
      console.log('');
    }

    // Amostrar alguns tokens
    console.log('📋 AMOSTRA DE TOKENS (primeiros 5):');
    competition.competitionTokens.slice(0, 5).forEach(token => {
      console.log(`   ${token.symbol}:`);
      console.log(`      ID: ${token.tokenId}`);
      console.log(`      Nome: ${token.name}`);
      console.log(`      Preço: $${token.currentPrice || 0}`);
      console.log(`      Market Cap: $${token.marketCap || 0}`);
      console.log(`      Imagem: ${token.imageUrl || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFallbackData();
