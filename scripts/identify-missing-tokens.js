const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function identifyMissingTokens() {
  console.log('🔍 Identificando tokens que não retornam do CoinGecko...\n');

  const competitionId = 'cmi1pvmrn0001q9qvbjejtuly';

  // Buscar todos os tokens da competição
  const tokens = await prisma.competitionToken.findMany({
    where: { competitionId },
    orderBy: { symbol: 'asc' }
  });

  console.log(`📊 Total de tokens no BD: ${tokens.length}\n`);
  console.log('🌐 Testando cada token no CoinGecko...\n');

  const missingTokens = [];
  const validTokens = [];

  for (const token of tokens) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${token.tokenId}?localization=false&tickers=false&community_data=false&developer_data=false`,
        { headers: { 'accept': 'application/json' } }
      );

      if (response.ok) {
        validTokens.push(token);
        console.log(`✅ ${token.symbol.padEnd(12)} - ${token.tokenId}`);
      } else {
        missingTokens.push(token);
        console.log(`❌ ${token.symbol.padEnd(12)} - ${token.tokenId} (Status: ${response.status})`);
      }

      // Rate limiting: aguardar um pouco entre requisições
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      missingTokens.push(token);
      console.log(`❌ ${token.symbol.padEnd(12)} - ${token.tokenId} (Erro: ${error.message})`);
    }
  }

  console.log('\n📋 RESUMO:');
  console.log(`✅ Tokens válidos: ${validTokens.length}`);
  console.log(`❌ Tokens com problema: ${missingTokens.length}\n`);

  if (missingTokens.length > 0) {
    console.log('❌ Tokens que precisam de correção:\n');
    missingTokens.forEach(token => {
      console.log(`   ${token.symbol} - ${token.name}`);
      console.log(`   tokenId atual: ${token.tokenId}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

identifyMissingTokens();
