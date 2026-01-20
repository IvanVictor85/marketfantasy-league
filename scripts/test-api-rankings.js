/**
 * 🧪 TESTA API DE RANKINGS
 */

async function main() {
  console.log('\n🧪 TESTANDO API /api/rankings/main\n');

  try {
    const response = await fetch('http://localhost:3000/api/rankings/main');

    if (!response.ok) {
      console.log(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();

    console.log('📊 RESPOSTA DA API:\n');
    console.log(`League: ${data.league?.name || 'N/A'}`);
    console.log(`Competition ID: ${data.ranking?.competitionId || 'N/A'}`);
    console.log(`Competition Status: ${data.ranking?.competitionStatus || 'N/A'}`);
    console.log(`Total Teams: ${data.ranking?.totalTeams || 0}`);
    console.log(`Last Updated: ${data.ranking?.lastUpdated || 'N/A'}\n`);

    if (data.ranking?.teams && data.ranking.teams.length > 0) {
      console.log('🏆 TOP 10 TIMES:\n');

      data.ranking.teams.slice(0, 10).forEach((team, i) => {
        const rank = i + 1;
        const name = team.teamName || 'Time sem nome';
        const score = team.totalScore?.toFixed(2) || '0.00';
        const tokens = team.tokens?.length || 0;

        console.log(`   ${rank}. ${name}`);
        console.log(`      Score: ${score}% (${tokens} tokens)`);
        console.log(`      User: ${team.username || team.userEmail || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Nenhum time encontrado\n');
    }

    console.log('✅ Teste concluído!\n');

  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

main();
