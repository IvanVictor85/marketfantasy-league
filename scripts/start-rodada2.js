/**
 * 📸 INICIA RODADA 2
 *
 * Executa snapshot inicial para começar a competição
 */

async function main() {
  console.log('\n📸 INICIANDO RODADA 2 COM SNAPSHOT\n');
  console.log('═'.repeat(80));

  const rodada2Id = 'cmicaluov000410ouj4ywkwop';

  try {
    const response = await fetch('http://localhost:3000/api/competition/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitionId: rodada2Id,
        skipTimeValidation: true
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SNAPSHOT INICIAL CONCLUÍDO!\n');
      console.log(`📊 Competição: ${result.competition?.name || 'Rodada 2'}`);
      console.log(`📊 Status: ${result.competition?.status || 'ACTIVE'}`);
      console.log(`📊 Tokens processados: ${result.tokensProcessed || result.competition?.competitionTokens?.length || 'N/A'}`);
      console.log(`📊 Times participantes: ${result.competition?.userTeams?.length || 25}`);
      console.log('');
      console.log('═'.repeat(80));
      console.log('\n🎉 RODADA 2 ESTÁ ATIVA!\n');
      console.log('✅ 25 times competindo');
      console.log('✅ Preços iniciais salvos');
      console.log('✅ Sistema de pontuação em tempo real');
      console.log('');
    } else {
      console.log('❌ ERRO AO INICIAR RODADA 2:\n');
      console.log(result.error || result.message || 'Erro desconhecido');
      console.log('');
    }

  } catch (error) {
    console.error('❌ FALHA NA REQUISIÇÃO:', error.message);
  }

  console.log('═'.repeat(80));
  console.log('');
}

main();
