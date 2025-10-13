import fetch from 'node-fetch';

const TEST_WALLET = 'H2312uRYYfSFsKiJeMwSriv6F7iEBkWxtPQCV6ArRAjT';
const BASE_URL = 'http://localhost:3000';

async function testTeamAPI() {
  console.log('🧪 Testando API GET /api/team...');
  
  try {
    const url = `${BASE_URL}/api/team?userWallet=${TEST_WALLET}&leagueId=`;
    console.log('📡 URL da requisição:', url);
    
    const response = await fetch(url);
    console.log('📊 Status da resposta:', response.status);
    console.log('✅ Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📋 Dados retornados:');
      console.log('  - hasTeam:', data.hasTeam);
      
      if (data.hasTeam) {
        console.log('  - Team ID:', data.team.id);
        console.log('  - Team Name:', data.team.name);
        console.log('  - Tokens:', data.team.tokens);
        console.log('  - Has Valid Entry:', data.team.hasValidEntry);
        console.log('  - Created At:', data.team.createdAt);
        console.log('  - Updated At:', data.team.updatedAt);
        console.log('  - Token Details Count:', data.tokenDetails?.length || 0);
        
        if (data.tokenDetails && data.tokenDetails.length > 0) {
          console.log('  - Primeiros 3 token details:');
          data.tokenDetails.slice(0, 3).forEach((token: any, index: number) => {
            console.log(`    ${index + 1}. ${token.symbol} - ${token.name}`);
          });
        }
      }
      
      console.log('  - League:', data.league);
    } else {
      const errorData = await response.text();
      console.log('❌ Erro na resposta:', errorData);
    }
    
  } catch (error) {
    console.error('💥 Erro ao testar API:', error);
  }
}

testTeamAPI();