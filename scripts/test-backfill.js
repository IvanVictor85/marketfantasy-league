// Importar usando dynamic import para ESM
async function testBackfill() {
  console.log('🧪 Testando nova lógica de backfill do getTop100Tokens()...\n');

  try {
    // Import dinâmico
    const { getTop100Tokens } = await import('../src/lib/services/coingecko.service.ts');

    const tokens = await getTop100Tokens();

    console.log('\n📊 RESULTADO DO TESTE:');
    console.log(`   Total de tokens: ${tokens.length}`);
    console.log(`   Meta: 100`);
    console.log(`   Status: ${tokens.length === 100 ? '✅ SUCESSO' : `⚠️ INCOMPLETO (${100 - tokens.length} faltando)`}\n`);

    // Verificar se todos têm preço
    const tokensWithPrice = tokens.filter(t => t.current_price > 0);
    const tokensWithoutPrice = tokens.filter(t => !t.current_price || t.current_price === 0);

    console.log('💰 ANÁLISE DE PREÇOS:');
    console.log(`   ✅ Com preço: ${tokensWithPrice.length}`);
    console.log(`   ❌ Sem preço: ${tokensWithoutPrice.length}\n`);

    if (tokensWithoutPrice.length > 0) {
      console.log('⚠️ TOKENS SEM PREÇO:');
      tokensWithoutPrice.forEach(t => {
        console.log(`   ${t.symbol} (${t.name})`);
      });
      console.log('');
    }

    // Mostrar primeiros e últimos 5
    console.log('📋 PRIMEIROS 5 TOKENS:');
    tokens.slice(0, 5).forEach((t, i) => {
      console.log(`   #${i + 1} ${t.symbol} - $${t.current_price.toLocaleString('en-US')}`);
    });

    console.log('\n📋 ÚLTIMOS 5 TOKENS:');
    tokens.slice(-5).forEach((t, i) => {
      console.log(`   #${tokens.length - 4 + i} ${t.symbol} - $${t.current_price.toLocaleString('en-US')}`);
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error(error.stack);
  }
}

testBackfill();
