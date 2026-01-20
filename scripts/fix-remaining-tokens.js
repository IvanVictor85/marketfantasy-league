const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapeamento de possíveis IDs alternativos para testar
const ALTERNATIVE_IDS = {
  'KHYPE': null, // Não existe no CoinGecko - remover ou encontrar alternativa
  'GT': 'gate', // Tentar ID alternativo
  'CC': 'canton-network', // Tentar ID alternativo
  'USDG': 'usdx-money', // Possível alternativa
  // Os outros já estão corretos segundo a pesquisa
};

async function testAndFixTokens() {
  console.log('🔍 Testando e corrigindo tokens restantes...\n');

  const competitionId = 'cmi1pvmrn0001q9qvbjejtuly';

  // Buscar tokens problemáticos
  const problematicSymbols = ['GT', 'CC', 'FBTC', 'KHYPE', 'SYRUPUSDC', 'USDF', 'USDG'];

  for (const symbol of problematicSymbols) {
    const token = await prisma.competitionToken.findFirst({
      where: {
        competitionId,
        symbol
      }
    });

    if (!token) {
      console.log(`❌ Token ${symbol} não encontrado no BD\n`);
      continue;
    }

    console.log(`📊 ${symbol} - ID atual: ${token.tokenId}`);

    // Testar o ID atual no endpoint /markets
    try {
      const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
      url.searchParams.set('vs_currency', 'usd');
      url.searchParams.set('ids', token.tokenId);

      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          console.log(`   ✅ ID atual funciona! Token encontrado: ${data[0].name}`);
        } else {
          console.log(`   ❌ ID não retorna dados do /markets`);

          // Tentar ID alternativo se existir
          if (ALTERNATIVE_IDS[symbol]) {
            console.log(`   🔄 Testando ID alternativo: ${ALTERNATIVE_IDS[symbol]}`);
            // Testar alternativa...
          } else if (ALTERNATIVE_IDS[symbol] === null) {
            console.log(`   ⚠️  Token não existe no CoinGecko - considerar remover`);
          }
        }
      } else {
        console.log(`   ⚠️  Erro na API: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro ao testar: ${error.message}`);
    }

    console.log('');

    // Delay para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  await prisma.$disconnect();
}

testAndFixTokens();
