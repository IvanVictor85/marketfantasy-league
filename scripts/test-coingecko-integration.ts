import { CoinGeckoService } from '../src/lib/coingecko-service';
import { ScoringService } from '../src/lib/scoring-service';

async function testCoinGeckoIntegration() {
  console.log('🧪 Testing CoinGecko Integration...\n');

  try {
    // Teste 1: Buscar preços de tokens populares
    console.log('📊 Test 1: Fetching token prices...');
    const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
    const tokenPrices = await CoinGeckoService.getTokenPrices(symbols);
    
    console.log(`✅ Fetched ${tokenPrices.length} token prices:`);
    tokenPrices.forEach(token => {
      console.log(`  ${token.symbol}: $${token.price.toFixed(2)} (${token.change24h.toFixed(2)}% 24h)`);
    });

    // Teste 2: Calcular pontuação de um token
    console.log('\n🎯 Test 2: Calculating token scores...');
    tokenPrices.forEach(token => {
      const score = CoinGeckoService.calculateTokenScore(token);
      console.log(`  ${token.symbol}: Score ${score.toFixed(2)}`);
    });

    // Teste 3: Calcular pontuação de um time
    console.log('\n🏆 Test 3: Calculating team score...');
    const teamScore = CoinGeckoService.calculateTeamScore(tokenPrices);
    console.log(`  Team Score: ${teamScore.toFixed(2)}`);

    // Teste 4: Dados simulados
    console.log('\n🎭 Test 4: Simulated data...');
    const simulatedTeams = ScoringService.generateSimulatedScores(3);
    simulatedTeams.forEach(team => {
      console.log(`  ${team.teamName}: ${team.totalScore.toFixed(2)} points (Rank #${team.rank})`);
    });

    // Teste 5: Cache stats
    console.log('\n💾 Test 5: Cache statistics...');
    const cacheStats = CoinGeckoService.getCacheStats();
    console.log(`  Cache size: ${cacheStats.size}`);
    console.log(`  Cache keys: ${cacheStats.keys.join(', ')}`);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  testCoinGeckoIntegration();
}

export { testCoinGeckoIntegration };
