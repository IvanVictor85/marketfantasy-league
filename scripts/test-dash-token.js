/**
 * 🧪 TEST DASH TOKEN
 *
 * Verifica se o token DASH está sendo retornado corretamente pela API
 */

async function testDashToken() {
  console.log('\n🧪 TESTANDO TOKEN DASH\n');
  console.log('='.repeat(80));

  // Teste 1: Buscar DASH especificamente
  console.log('\n📡 TESTE 1: Buscar DASH especificamente\n');

  try {
    const response1 = await fetch('http://localhost:3000/api/market?ids=dash');

    console.log(`Status: ${response1.status}`);

    if (response1.ok) {
      const data = await response1.json();

      console.log(`\nFormato: ${Array.isArray(data) ? 'Array' : 'Object'}`);
      console.log(`Tokens retornados: ${Array.isArray(data) ? data.length : (data.tokens ? data.tokens.length : 0)}`);

      const tokens = Array.isArray(data) ? data : (data.tokens || []);

      if (tokens.length > 0) {
        const dash = tokens[0];
        console.log('\n✅ DASH encontrado:');
        console.log(`   ID: ${dash.id}`);
        console.log(`   Symbol: ${dash.symbol}`);
        console.log(`   Nome: ${dash.name}`);
        console.log(`   Preço: $${dash.currentPrice}`);
        console.log(`   Variação 7d: ${dash.priceChange7d}%`);
        console.log(`   Imagem: ${dash.image?.substring(0, 60)}...`);
      } else {
        console.error('❌ DASH não encontrado na resposta!');
      }
    } else {
      const errorText = await response1.text();
      console.error(`❌ Erro HTTP ${response1.status}:`, errorText);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }

  // Teste 2: Buscar lista de tokens (modo normal)
  console.log('\n' + '='.repeat(80));
  console.log('\n📡 TESTE 2: Buscar todos os tokens (verificar se DASH está incluído)\n');

  try {
    const response2 = await fetch('http://localhost:3000/api/market');

    console.log(`Status: ${response2.status}`);

    if (response2.ok) {
      const data = await response2.json();

      const tokens = data.tokens || [];
      console.log(`\nTotal de tokens: ${tokens.length}`);

      const dash = tokens.find(t => t.symbol.toUpperCase() === 'DASH' || t.id === 'dash');

      if (dash) {
        console.log('\n✅ DASH encontrado na lista completa:');
        console.log(`   Posição: ${tokens.indexOf(dash) + 1}/${tokens.length}`);
        console.log(`   ID: ${dash.id}`);
        console.log(`   Symbol: ${dash.symbol}`);
        console.log(`   Nome: ${dash.name}`);
        console.log(`   Preço: $${dash.currentPrice}`);
        console.log(`   Variação 7d: ${dash.priceChange7d}%`);
        console.log(`   Market Cap Rank: ${dash.marketCapRank}`);
      } else {
        console.error('❌ DASH NÃO encontrado na lista completa!');
        console.log('\n🔍 Verificando se há tokens extras sendo buscados...');
        console.log(`Top 100 Count: ${data.top100Count || 'N/A'}`);
        console.log(`Extra Count: ${data.extraCount || 'N/A'}`);
      }
    } else {
      const errorText = await response2.text();
      console.error(`❌ Erro HTTP ${response2.status}:`, errorText);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }

  // Teste 3: Verificar diretamente com CoinGecko
  console.log('\n' + '='.repeat(80));
  console.log('\n📡 TESTE 3: Verificar diretamente com CoinGecko API\n');

  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=dash&price_change_percentage=1h,24h,7d,30d';

    const response3 = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MFL-Platform/1.0',
      }
    });

    console.log(`Status: ${response3.status}`);

    if (response3.ok) {
      const data = await response3.json();

      if (data.length > 0) {
        const dash = data[0];
        console.log('\n✅ DASH retornado pela CoinGecko:');
        console.log(`   ID: ${dash.id}`);
        console.log(`   Symbol: ${dash.symbol}`);
        console.log(`   Nome: ${dash.name}`);
        console.log(`   Preço: $${dash.current_price}`);
        console.log(`   Variação 7d: ${dash.price_change_percentage_7d_in_currency}%`);
        console.log(`   Market Cap: $${dash.market_cap?.toLocaleString()}`);
        console.log(`   Market Cap Rank: #${dash.market_cap_rank}`);
      } else {
        console.error('❌ CoinGecko retornou array vazio!');
      }
    } else {
      const errorText = await response3.text();
      console.error(`❌ Erro HTTP ${response3.status}:`, errorText);
    }
  } catch (error) {
    console.error('❌ Erro na requisição CoinGecko:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Teste concluído!\n');
}

testDashToken();
