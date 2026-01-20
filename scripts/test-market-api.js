async function testMarketAPI() {
  console.log('🔍 Testando API /api/market local...\n');

  try {
    const response = await fetch('http://localhost:3000/api/market');

    console.log(`📡 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();

      console.log(`\n✅ API /api/market funcionando!`);
      console.log(`📊 Tokens retornados: ${data.count}`);
      console.log(`⏱️  Duração: ${data.duration}ms`);
      console.log(`📅 Competição: ${data.competition?.id}`);
      console.log(`🔒 Status: ${data.competition?.status}`);

      if (data.warning) {
        console.log(`⚠️  Warning: ${data.warning}`);
      }

      if (data.mode === 'fallback') {
        console.log(`⚠️  Modo: FALLBACK (ainda usando dados do banco)`);
      }

      // Verificar se tokens têm preços
      const tokensWithPrice = data.tokens.filter(t => t.currentPrice > 0);
      const tokensWithoutPrice = data.tokens.filter(t => t.currentPrice === 0);

      console.log(`\n💰 Tokens com preço: ${tokensWithPrice.length}/${data.count}`);
      console.log(`❌ Tokens sem preço: ${tokensWithoutPrice.length}/${data.count}`);

      // Mostrar alguns exemplos
      console.log('\n📋 Primeiros 5 tokens:');
      data.tokens.slice(0, 5).forEach(token => {
        console.log(`   ${token.symbol}: $${token.currentPrice || 0} (${token.name})`);
      });

    } else {
      const error = await response.json();
      console.log('❌ Erro na API:');
      console.log(error);
    }

  } catch (error) {
    console.log('❌ Erro ao testar API:');
    console.log(error.message);
  }
}

testMarketAPI();
