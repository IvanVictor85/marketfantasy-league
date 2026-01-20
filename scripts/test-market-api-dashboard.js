/**
 * 🧪 TEST MARKET API FOR DASHBOARD
 *
 * Testa a API /api/market com IDs específicos para ver se está retornando dados
 */

async function testMarketAPI() {
  console.log('\n🧪 TESTANDO API /api/market PARA DASHBOARD\n');
  console.log('='.repeat(80));

  // IDs comuns usados no dashboard
  const testIds = 'solana,bitcoin,ethereum,cardano,polkadot,chainlink,avalanche-2,matic-network,dogecoin,uniswap';

  try {
    console.log(`\n📡 Chamando: http://localhost:3000/api/market?ids=${testIds}\n`);

    const response = await fetch(`http://localhost:3000/api/market?ids=${testIds}`);

    console.log(`Status HTTP: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro HTTP ${response.status}:`, errorText);
      return;
    }

    const data = await response.json();

    console.log('📊 RESPOSTA DA API:\n');
    console.log(`Tipo de dados: ${Array.isArray(data) ? 'Array' : typeof data}`);

    if (Array.isArray(data)) {
      console.log(`✅ Array com ${data.length} tokens\n`);

      if (data.length > 0) {
        console.log('📝 AMOSTRA (primeiros 3 tokens):\n');
        data.slice(0, 3).forEach((token, i) => {
          console.log(`${i + 1}. ${token.symbol} (${token.id})`);
          console.log(`   Nome: ${token.name}`);
          console.log(`   Preço: $${token.currentPrice}`);
          console.log(`   Variação 7d: ${token.priceChange7d}%`);
          console.log(`   Imagem: ${token.image?.substring(0, 50)}...`);
          console.log('');
        });
      } else {
        console.warn('⚠️ Array vazio - nenhum token retornado!');
      }
    } else if (data.tokens && Array.isArray(data.tokens)) {
      console.log(`✅ Formato {tokens: Array} com ${data.tokens.length} tokens\n`);

      if (data.tokens.length > 0) {
        console.log('📝 AMOSTRA (primeiros 3 tokens):\n');
        data.tokens.slice(0, 3).forEach((token, i) => {
          console.log(`${i + 1}. ${token.symbol} (${token.id})`);
          console.log(`   Nome: ${token.name}`);
          console.log(`   Preço: $${token.currentPrice}`);
          console.log(`   Variação 7d: ${token.priceChange7d}%`);
          console.log(`   Imagem: ${token.image?.substring(0, 50)}...`);
          console.log('');
        });
      } else {
        console.warn('⚠️ Array vazio - nenhum token retornado!');
      }
    } else {
      console.log('📄 Formato completo da resposta:');
      console.log(JSON.stringify(data, null, 2));
    }

    // Verificar erros na resposta
    if (data.error) {
      console.error('\n❌ ERRO NA RESPOSTA:', data.error);
      if (data.details) {
        console.error('Detalhes:', data.details);
      }
      if (data.requestedIds) {
        console.error('IDs solicitados:', data.requestedIds);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Teste concluído!\n');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error(error.stack);
  }
}

testMarketAPI();
