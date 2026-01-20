// Testar se DASH retorna dados do CoinGecko

async function testDash() {
  console.log('🧪 Testando DASH no CoinGecko...\n');

  try {
    // 1. Buscar DASH especificamente
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=dash&price_change_percentage=1h,24h,7d,30d';

    console.log('📡 URL:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoFantasy/1.0'
      }
    });

    if (!response.ok) {
      console.error(`❌ Erro HTTP: ${response.status}`);
      return;
    }

    const data = await response.json();

    console.log(`✅ Status: ${response.status}\n`);

    if (data.length === 0) {
      console.log('❌ DASH não retornou dados!');
      return;
    }

    const dash = data[0];

    console.log('📊 Dados do DASH:');
    console.log(`   ID: ${dash.id}`);
    console.log(`   Symbol: ${dash.symbol}`);
    console.log(`   Name: ${dash.name}`);
    console.log(`   Rank: ${dash.market_cap_rank}`);
    console.log(`   Price: $${dash.current_price}`);
    console.log(`   Market Cap: $${dash.market_cap?.toLocaleString()}`);
    console.log(`   Image: ${dash.image}`);
    console.log(`   24h Change: ${dash.price_change_percentage_24h?.toFixed(2)}%`);
    console.log('');

    // 2. Verificar se a imagem está acessível
    console.log('🖼️ Testando acesso à imagem...');
    const imageResponse = await fetch(dash.image);

    if (imageResponse.ok) {
      console.log(`✅ Imagem acessível (${imageResponse.status})`);
    } else {
      console.log(`❌ Imagem inacessível (${imageResponse.status})`);
    }

    console.log('');

    // 3. Testar busca por símbolo (DASH)
    console.log('🔍 Buscando top 100 e procurando DASH por símbolo...');
    const top100Url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=1h,24h,7d,30d';

    const top100Response = await fetch(top100Url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoFantasy/1.0'
      }
    });

    if (top100Response.ok) {
      const top100 = await top100Response.json();
      const dashInTop100 = top100.find(t => t.symbol.toUpperCase() === 'DASH');

      if (dashInTop100) {
        console.log(`✅ DASH encontrado no top 100:`);
        console.log(`   Posição: #${dashInTop100.market_cap_rank}`);
        console.log(`   ID: ${dashInTop100.id}`);
        console.log(`   Image: ${dashInTop100.image}`);
      } else {
        console.log('❌ DASH NÃO encontrado no top 100');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testDash();
