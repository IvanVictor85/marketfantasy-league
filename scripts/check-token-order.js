async function checkTokenOrder() {
  console.log('🔍 Verificando quantos tokens a CoinGecko retorna no Top 100...\n');

  try {
    const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('order', 'market_cap_desc');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', '1');
    url.searchParams.set('price_change_percentage', '1h,24h,7d,30d');

    console.log('🌐 Buscando página 1 (Top 100)...');
    const response1 = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' }
    });

    if (!response1.ok) {
      console.log(`❌ Erro: ${response1.status}`);
      return;
    }

    const page1 = await response1.json();
    console.log(`✅ Página 1: ${page1.length} tokens\n`);

    // Verificar se há tokens duplicados ou inválidos
    const validTokens = page1.filter(t => t.current_price && t.current_price > 0);
    const invalidTokens = page1.filter(t => !t.current_price || t.current_price === 0);

    console.log(`📊 Análise da Página 1:`);
    console.log(`   ✅ Tokens válidos (com preço): ${validTokens.length}`);
    console.log(`   ❌ Tokens inválidos (sem preço): ${invalidTokens.length}\n`);

    if (invalidTokens.length > 0) {
      console.log('⚠️ TOKENS INVÁLIDOS (sem preço):');
      invalidTokens.forEach(t => {
        console.log(`   #${t.market_cap_rank} ${t.symbol.toUpperCase()} - $${t.current_price || 0}`);
      });
      console.log('');
    }

    // Se não tem 100 válidos, buscar página 2
    if (validTokens.length < 100) {
      console.log(`🔄 Apenas ${validTokens.length} tokens válidos. Buscando página 2...\n`);

      url.searchParams.set('page', '2');
      const response2 = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' }
      });

      if (response2.ok) {
        const page2 = await response2.json();
        console.log(`✅ Página 2: ${page2.length} tokens`);

        const validPage2 = page2.filter(t => t.current_price && t.current_price > 0);
        console.log(`   ✅ Válidos: ${validPage2.length}\n`);

        const needed = 100 - validTokens.length;
        console.log(`💡 SOLUÇÃO: Precisamos de ${needed} tokens da página 2 para completar 100`);
        console.log(`   Tokens #101-#${100 + needed} da lista\n`);

        console.log('📋 Primeiros 5 tokens da página 2:');
        validPage2.slice(0, 5).forEach(t => {
          console.log(`   #${t.market_cap_rank} ${t.symbol.toUpperCase()} - $${t.current_price}`);
        });
      }
    }

    console.log('\n📊 RESUMO:');
    console.log(`   Total solicitado: 100`);
    console.log(`   Total recebido: ${page1.length}`);
    console.log(`   Válidos (com preço): ${validTokens.length}`);
    console.log(`   Inválidos (sem preço): ${invalidTokens.length}`);
    console.log(`   Faltam: ${100 - validTokens.length} tokens`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkTokenOrder();
