async function testCoinGecko() {
  console.log('🔍 Testando se CoinGecko está online...\n');

  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&price_change_percentage=1h,24h,7d,30d';

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    console.log(`📡 Status da resposta: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ CoinGecko API está ONLINE!`);
        console.log(`📊 Tokens retornados: ${data.length}\n`);

        data.forEach(token => {
          console.log(`💰 ${token.symbol.toUpperCase()}: $${token.current_price.toLocaleString('en-US')}`);
          console.log(`   📈 24h: ${token.price_change_percentage_24h?.toFixed(2)}%`);
          console.log(`   🏆 Market Cap Rank: #${token.market_cap_rank}`);
          console.log('');
        });
      } else {
        console.log('⚠️ CoinGecko retornou array vazio');
      }
    } else {
      const text = await response.text();
      console.log('❌ CoinGecko ainda está OFFLINE');
      console.log(`📄 Resposta: ${text.substring(0, 200)}...`);
    }

  } catch (error) {
    console.log('❌ Erro ao testar CoinGecko:');
    console.log(error.message);
  }
}

testCoinGecko();
