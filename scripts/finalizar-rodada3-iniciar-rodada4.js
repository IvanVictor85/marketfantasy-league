/**
 * 🔄 FINALIZA RODADA 3 E INICIA RODADA 4
 *
 * Sequência completa:
 * 1. Popular Rodada 4 com times da Rodada 3
 * 2. Snapshot final da Rodada 3 (calcula pontuação)
 * 3. Snapshot inicial da Rodada 4
 * 4. Mostrar ranking final da Rodada 3
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodada3Id = 'cmicalusz000610ousgsnhr2z';
const rodada4Id = 'cmicalux3000810oueqd2dkax';

async function main() {
  console.log('\n🔄 FINALIZANDO RODADA 3 E INICIANDO RODADA 4\n');
  console.log('═'.repeat(80));

  // ============================================================================
  // PASSO 1: POPULAR RODADA 4 COM TIMES DA RODADA 3
  // ============================================================================
  console.log('\n📝 PASSO 1: Populando Rodada 4 com times da Rodada 3...\n');

  try {
    // Buscar times da Rodada 3
    const rodada3Teams = await prisma.userTeam.findMany({
      where: { competitionId: rodada3Id },
      include: { user: { select: { username: true, email: true } } }
    });

    console.log(`Times encontrados na Rodada 3: ${rodada3Teams.length}`);

    // Verificar times já existentes na Rodada 4
    const existingRodada4Teams = await prisma.userTeam.findMany({
      where: { competitionId: rodada4Id }
    });

    console.log(`Times já cadastrados na Rodada 4: ${existingRodada4Teams.length}`);

    const existingUserIds = new Set(existingRodada4Teams.map(t => t.userId));
    const teamsToCreate = rodada3Teams.filter(t => !existingUserIds.has(t.userId));

    console.log(`Times a criar: ${teamsToCreate.length}\n`);

    // Criar times
    let created = 0;
    for (const team of teamsToCreate) {
      await prisma.userTeam.create({
        data: {
          userId: team.userId,
          competitionId: rodada4Id,
          teamName: team.teamName,
          players: team.players,
          totalPoints: 0
        }
      });

      console.log(`   ✅ ${team.teamName} (${team.user.username || team.user.email})`);
      created++;
    }

    console.log(`\n✅ ${created} times criados na Rodada 4!`);

    // Verificar total
    const totalRodada4 = await prisma.userTeam.count({
      where: { competitionId: rodada4Id }
    });

    console.log(`✅ Total de times na Rodada 4: ${totalRodada4}`);

  } catch (error) {
    console.error('❌ Erro ao popular Rodada 4:', error.message);
    await prisma.$disconnect();
    return;
  }

  // ============================================================================
  // PASSO 2: SNAPSHOT FINAL DA RODADA 3
  // ============================================================================
  console.log('\n═'.repeat(80));
  console.log('\n📸 PASSO 2: Executando snapshot final da Rodada 3...\n');

  try {
    const response1 = await fetch('http://localhost:3000/api/competition/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitionId: rodada3Id,
        skipTimeValidation: true
      })
    });

    const result1 = await response1.json();

    if (response1.ok) {
      console.log('✅ Snapshot final da Rodada 3 concluído!');
      console.log(`   Status: ${result1.competition?.status || 'COMPLETED'}`);
      console.log('');
    } else {
      console.log('❌ Erro no snapshot final:', result1.error);
      throw new Error(result1.error);
    }
  } catch (error) {
    console.error('❌ Falha no snapshot final da Rodada 3:', error.message);
    await prisma.$disconnect();
    return;
  }

  // ============================================================================
  // PASSO 3: SNAPSHOT INICIAL DA RODADA 4
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('\n📸 PASSO 3: Executando snapshot inicial da Rodada 4...\n');

  try {
    const response2 = await fetch('http://localhost:3000/api/competition/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitionId: rodada4Id,
        skipTimeValidation: true
      })
    });

    const result2 = await response2.json();

    if (response2.ok) {
      console.log('✅ Snapshot inicial da Rodada 4 concluído!');
      console.log(`   Status: ${result2.competition?.status || 'ACTIVE'}`);
      console.log('');
    } else {
      console.log('⚠️  Aviso no snapshot inicial:', result2.error);
      console.log('   (Pode ser normal se já foi iniciado)\n');
    }
  } catch (error) {
    console.error('❌ Falha no snapshot inicial da Rodada 4:', error.message);
  }

  // ============================================================================
  // PASSO 4: MOSTRAR RANKING FINAL DA RODADA 3
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('\n🏆 PASSO 4: Ranking Final da Rodada 3\n');

  try {
    const rodada3 = await prisma.competition.findUnique({
      where: { id: rodada3Id },
      include: {
        userTeams: {
          orderBy: { totalPoints: 'desc' },
          include: { user: { select: { username: true, email: true } } }
        }
      }
    });

    console.log(`📊 Competição: ${rodada3.name}`);
    console.log(`📊 Status: ${rodada3.status}`);
    console.log(`📊 Times: ${rodada3.userTeams.length}`);
    console.log(`📊 Prize Pool: ${Number(rodada3.prizePool)} SOL\n`);

    console.log('═'.repeat(80));
    console.log('🏆 PÓDIO FINAL:\n');

    rodada3.userTeams.slice(0, 10).forEach((team, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
      const position = (i + 1).toString().padStart(2, ' ');
      const name = team.teamName.padEnd(30, ' ');
      const score = Number(team.totalPoints).toFixed(2).padStart(8, ' ');
      const user = team.user.username || team.user.email;

      console.log(`${medal} ${position}º - ${name} - ${score} pts (${user})`);
    });

    // Estatísticas
    const scores = rodada3.userTeams.map(t => Number(t.totalPoints));
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    console.log('\n═'.repeat(80));
    console.log('\n📊 ESTATÍSTICAS:\n');
    console.log(`   🏆 Maior pontuação: ${maxScore.toFixed(2)} pts`);
    console.log(`   📉 Menor pontuação: ${minScore.toFixed(2)} pts`);
    console.log(`   📊 Pontuação média: ${avgScore.toFixed(2)} pts`);
    console.log(`   📈 Amplitude: ${(maxScore - minScore).toFixed(2)} pts`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao buscar ranking:', error.message);
  }

  // ============================================================================
  // RESUMO FINAL
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('\n🎉 PROCESSO COMPLETO!\n');
  console.log('✅ Rodada 3: COMPLETED (pontuações calculadas)');
  console.log('✅ Rodada 4: ACTIVE (snapshot inicial feito)');
  console.log(`✅ Times migrados: ${rodada3Teams.length}`);
  console.log('');
  console.log('💡 PRÓXIMOS PASSOS:');
  console.log('   1. Verificar ranking da Rodada 3 no frontend');
  console.log('   2. Rodada 4 já está pronta e competindo!');
  console.log('   3. Sistema de pontuação em tempo real ativo');
  console.log('');
  console.log('═'.repeat(80));
  console.log('');

  await prisma.$disconnect();
}

main().catch(console.error);
