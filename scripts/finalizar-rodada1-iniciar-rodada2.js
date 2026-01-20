/**
 * 🏁 FINALIZA RODADA 1 E INICIA RODADA 2
 *
 * Sequência completa:
 * 1. Snapshot final da Rodada 1
 * 2. Boost Sport Club Receba (teste de premiação)
 * 3. Snapshot inicial da Rodada 2
 */

async function main() {
  console.log('\n🏁 FINALIZANDO RODADA 1 E INICIANDO RODADA 2\n');
  console.log('═'.repeat(80));

  const rodada1Id = 'cmicalugq000210ou5ri809wa';
  const rodada2Id = 'cmicaluov000410ouj4ywkwop';

  // ============================================================================
  // PASSO 1: SNAPSHOT FINAL DA RODADA 1
  // ============================================================================
  console.log('\n📸 PASSO 1: Executando snapshot final da Rodada 1...\n');

  try {
    const response1 = await fetch('http://localhost:3000/api/competition/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitionId: rodada1Id,
        skipTimeValidation: true
      })
    });

    const result1 = await response1.json();

    if (response1.ok) {
      console.log('✅ Snapshot final da Rodada 1 concluído!');
      console.log(`   Status: ${result1.competition?.status || 'COMPLETED'}`);
      console.log(`   Times processados: ${result1.scoresCalculated || 'N/A'}`);
      console.log('');
    } else {
      console.log('❌ Erro no snapshot final:', result1.error);
      throw new Error(result1.error);
    }
  } catch (error) {
    console.error('❌ Falha no snapshot final da Rodada 1:', error.message);
    return;
  }

  // ============================================================================
  // PASSO 2: BOOST SPORT CLUB RECEBA
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('\n🚀 PASSO 2: Dando boost para Sport Club Receba...\n');

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Buscar time Sport Club Receba
    const receba = await prisma.userTeam.findFirst({
      where: {
        competitionId: rodada1Id,
        teamName: { contains: 'Receba' }
      },
      include: {
        user: { select: { username: true, email: true } }
      }
    });

    if (!receba) {
      console.log('❌ Time Sport Club Receba não encontrado');
    } else {
      console.log(`📊 Time: ${receba.teamName}`);
      console.log(`👤 Jogador: ${receba.user.username || receba.user.email}`);
      console.log(`📊 Pontuação atual: ${Number(receba.totalPoints).toFixed(2)} pts\n`);

      // Buscar maior pontuação
      const topTeam = await prisma.userTeam.findFirst({
        where: { competitionId: rodada1Id },
        orderBy: { totalPoints: 'desc' }
      });

      const currentTopScore = topTeam ? Number(topTeam.totalPoints) : 0;
      const newScore = Math.max(65, currentTopScore + 10);

      console.log(`🏆 Maior pontuação: ${currentTopScore.toFixed(2)} pts`);
      console.log(`🎯 Nova pontuação Receba: ${newScore.toFixed(2)} pts\n`);

      // Atualizar
      await prisma.userTeam.update({
        where: { id: receba.id },
        data: { totalPoints: newScore }
      });

      console.log('✅ Sport Club Receba agora está em 1º LUGAR!');
      console.log(`   Pontuação: ${newScore.toFixed(2)} pts`);
      console.log('');
    }

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Erro no boost:', error.message);
  }

  // ============================================================================
  // PASSO 3: SNAPSHOT INICIAL DA RODADA 2
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('\n📸 PASSO 3: Executando snapshot inicial da Rodada 2...\n');

  try {
    const response2 = await fetch('http://localhost:3000/api/competition/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitionId: rodada2Id,
        skipTimeValidation: true
      })
    });

    const result2 = await response2.json();

    if (response2.ok) {
      console.log('✅ Snapshot inicial da Rodada 2 concluído!');
      console.log(`   Status: ${result2.competition?.status || 'ACTIVE'}`);
      console.log(`   Tokens: ${result2.tokensProcessed || 'N/A'}`);
      console.log('');
    } else {
      console.log('⚠️  Aviso no snapshot inicial:', result2.error);
      console.log('   (Pode ser normal se já foi iniciado)\n');
    }
  } catch (error) {
    console.error('❌ Falha no snapshot inicial da Rodada 2:', error.message);
  }

  // ============================================================================
  // RESUMO FINAL
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('\n🎉 PROCESSO COMPLETO!\n');
  console.log('✅ Rodada 1: COMPLETED (Sport Club Receba em 1º)');
  console.log('✅ Rodada 2: ACTIVE (snapshot inicial feito)');
  console.log('');
  console.log('💡 PRÓXIMOS PASSOS:');
  console.log('   1. Teste o claim da premiação com o usuário Tokenizer');
  console.log('   2. Verifique o ranking da Rodada 1 no frontend');
  console.log('   3. Rodada 2 já está pronta para receber times!');
  console.log('');
  console.log('═'.repeat(80));
  console.log('');
}

main().catch(console.error);
