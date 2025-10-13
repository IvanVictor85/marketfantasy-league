import fetch from 'node-fetch';

const TEST_WALLET = 'H2312uRYYfSFsKiJeMwSriv6F7iEBkWxtPQCV6ArRAjT';
const BASE_URL = 'http://localhost:3000';

async function testNavigationFlow() {
  console.log('🧪 Testando fluxo completo de navegação...');
  
  try {
    // 1. Simular carregamento inicial da página de teams
    console.log('\n1️⃣ Carregando página de teams...');
    const teamsResponse = await fetch(`${BASE_URL}/pt/teams`);
    console.log('   Status:', teamsResponse.status, teamsResponse.ok ? '✅' : '❌');
    
    // 2. Simular verificação de entrada na liga
    console.log('\n2️⃣ Verificando entrada na liga...');
    const entryResponse = await fetch(`${BASE_URL}/api/league/check-entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userWallet: TEST_WALLET,
        leagueId: undefined
      })
    });
    
    if (entryResponse.ok) {
      const entryData = await entryResponse.json();
      console.log('   Entrada válida:', entryData.hasPaid ? '✅' : '❌');
    }
    
    // 3. Simular carregamento do time existente
    console.log('\n3️⃣ Carregando time existente...');
    const teamResponse = await fetch(`${BASE_URL}/api/team?userWallet=${TEST_WALLET}&leagueId=`);
    
    if (teamResponse.ok) {
      const teamData = await teamResponse.json();
      console.log('   Time encontrado:', teamData.hasTeam ? '✅' : '❌');
      
      if (teamData.hasTeam) {
        console.log('   Nome do time:', teamData.team.name);
        console.log('   Tokens:', teamData.team.tokens.length);
        console.log('   Token details:', teamData.tokenDetails?.length || 0);
        console.log('   Entrada válida:', teamData.team.hasValidEntry ? '✅' : '❌');
        
        // Verificar se todos os dados necessários estão presentes
        const hasAllData = teamData.team.name && 
                          teamData.team.tokens && 
                          teamData.team.tokens.length === 10 &&
                          teamData.tokenDetails &&
                          teamData.tokenDetails.length === 10;
        
        console.log('   Dados completos para carregamento:', hasAllData ? '✅' : '❌');
        
        if (hasAllData) {
          console.log('\n🎯 Simulando criação de players...');
          const players = teamData.team.tokens.map((symbol: string, index: number) => {
            const tokenDetail = teamData.tokenDetails.find((t: any) => t.symbol === symbol);
            return {
              id: symbol,
              position: index + 1,
              name: tokenDetail?.name || symbol,
              token: symbol,
              image: tokenDetail?.logoUrl || '',
              price: tokenDetail?.currentPrice || 0,
              points: 0,
              rarity: 'common',
              change_24h: tokenDetail?.priceChange24h || 0
            };
          });
          
          console.log('   Players criados:', players.length);
          console.log('   Primeiros 3 players:');
          players.slice(0, 3).forEach((player: any, index: number) => {
            console.log(`     ${index + 1}. ${player.name} (${player.token}) - $${player.price}`);
          });
        }
      }
    }
    
    // 4. Simular navegação para outra página e volta
    console.log('\n4️⃣ Simulando navegação para dashboard...');
    const dashboardResponse = await fetch(`${BASE_URL}/pt/dashboard`);
    console.log('   Dashboard carregado:', dashboardResponse.ok ? '✅' : '❌');
    
    console.log('\n5️⃣ Simulando volta para teams...');
    const teamsResponse2 = await fetch(`${BASE_URL}/pt/teams`);
    console.log('   Teams recarregado:', teamsResponse2.ok ? '✅' : '❌');
    
    // 6. Verificar se o time ainda carrega corretamente
    console.log('\n6️⃣ Verificando carregamento após navegação...');
    const teamResponse2 = await fetch(`${BASE_URL}/api/team?userWallet=${TEST_WALLET}&leagueId=`);
    
    if (teamResponse2.ok) {
      const teamData2 = await teamResponse2.json();
      console.log('   Time ainda encontrado:', teamData2.hasTeam ? '✅' : '❌');
      console.log('   Dados consistentes:', 
        teamData2.hasTeam && 
        teamData2.team.name === 'Sport Club Recebaaa' &&
        teamData2.team.tokens.length === 10 ? '✅' : '❌');
    }
    
    console.log('\n🎉 Teste de navegação concluído!');
    
  } catch (error) {
    console.error('💥 Erro no teste de navegação:', error);
  }
}

testNavigationFlow();