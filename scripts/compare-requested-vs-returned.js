const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compareTokens() {
  console.log('🔍 Comparando tokens solicitados vs retornados do CoinGecko...\n');

  const competitionId = 'cmi1pvmrn0001q9qvbjejtuly';

  // Buscar todos os tokens da competição
  const tokens = await prisma.competitionToken.findMany({
    where: { competitionId },
    orderBy: { symbol: 'asc' }
  });

  const requestedIds = tokens.map(t => t.tokenId);
  console.log(`📊 Total de tokens solicitados: ${requestedIds.length}\n`);

  // Chamar API do CoinGecko (mesmo método que o app usa)
  const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
  url.searchParams.set('vs_currency', 'usd');
  url.searchParams.set('ids', requestedIds.join(','));
  url.searchParams.set('price_change_percentage', '1h,24h,7d,30d');
  url.searchParams.set('per_page', '250'); // Garantir que não trunca

  console.log('🌐 Chamando CoinGecko API...\n');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MFL-Platform/1.0',
      },
    });

    if (!response.ok) {
      console.error(`❌ Erro na API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Resposta:', errorText.substring(0, 500));
      await prisma.$disconnect();
      return;
    }

    const data = await response.json();
    const returnedIds = data.map(token => token.id);

    console.log(`✅ Tokens retornados pela API: ${returnedIds.length}\n`);

    // Encontrar os IDs que foram solicitados mas NÃO retornados
    const missingIds = requestedIds.filter(id => !returnedIds.includes(id));

    console.log(`❌ Tokens FALTANDO (${missingIds.length}):\n`);

    if (missingIds.length > 0) {
      missingIds.forEach(id => {
        const token = tokens.find(t => t.tokenId === id);
        console.log(`   ${token.symbol.padEnd(12)} - ${id}`);
        console.log(`   Nome: ${token.name}`);
        console.log('');
      });

      console.log('\n🔧 PRÓXIMOS PASSOS:\n');
      console.log('Para cada token acima, você precisa:');
      console.log('1. Verificar se o ID do CoinGecko está correto em https://www.coingecko.com/');
      console.log('2. Alguns tokens podem não estar disponíveis no endpoint /markets');
      console.log('3. Atualizar o SYMBOL_TO_ID_MAP em src/lib/services/coingecko.service.ts');
      console.log('4. Executar script para atualizar IDs no banco de dados');
    } else {
      console.log('✅ Todos os tokens foram retornados com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro ao chamar API:', error.message);
  }

  await prisma.$disconnect();
}

compareTokens();
