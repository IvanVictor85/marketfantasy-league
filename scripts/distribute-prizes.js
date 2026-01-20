const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 💰 DISTRIBUIÇÃO DE PRÊMIOS
 *
 * Este script é executado AUTOMATICAMENTE pelo snapshot-final.js
 * Calcula e registra prêmios disponíveis para claim.
 *
 * Distribuição:
 * - 1º lugar: 50%
 * - 2º lugar: 25%
 * - 3º lugar: 15%
 * - Último: 10%
 */

/**
 * Distribui prêmios de uma rodada (Competition)
 */
async function distributeRoundPrizes(competitionId) {
  console.log(`\n💰 Distribuindo prêmios da rodada ${competitionId}...`);

  try {
    // 1️⃣ BUSCAR COMPETIÇÃO E TIMES
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        userTeams: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!competition) {
      throw new Error('Competição não encontrada');
    }

    if (competition.distributed) {
      console.log('   ⚠️  Prêmios já foram distribuídos para esta rodada');
      return;
    }

    const prizePool = parseFloat(competition.prizePool);

    if (prizePool === 0) {
      console.log('   ⚠️  Nenhum prêmio acumulado nesta rodada');
      return;
    }

    // 2️⃣ ORDENAR TIMES POR PONTUAÇÃO
    const rankedTeams = competition.userTeams
      .map(team => ({
        userId: team.userId,
        teamName: team.teamName || 'Sem nome',
        userName: team.user.name || team.user.email,
        points: parseFloat(team.totalPoints)
      }))
      .sort((a, b) => b.points - a.points);

    if (rankedTeams.length === 0) {
      console.log('   ⚠️  Nenhum time participou desta rodada');
      return;
    }

    console.log(`   🏆 Prize Pool: ${prizePool} SOL`);
    console.log(`   👥 Participantes: ${rankedTeams.length}`);

    // 3️⃣ CALCULAR DISTRIBUIÇÃO
    const distribution = [
      { position: 1, percentage: 50, emoji: '🥇' }, // 1º lugar
      { position: 2, percentage: 25, emoji: '🥈' }, // 2º lugar
      { position: 3, percentage: 15, emoji: '🥉' }, // 3º lugar
      { position: -1, percentage: 10, emoji: '🎖️' }  // Último lugar
    ];

    console.log('\n   📊 DISTRIBUIÇÃO:');
    console.log('   ' + '='.repeat(70));

    // 4️⃣ CRIAR PRIZE CLAIMS
    for (const dist of distribution) {
      let teamIndex;

      if (dist.position === -1) {
        // Último lugar
        teamIndex = rankedTeams.length - 1;
      } else {
        // 1º, 2º, 3º
        teamIndex = dist.position - 1;
      }

      // Verificar se existe time nessa posição
      if (teamIndex >= rankedTeams.length) {
        console.log(`   ⚠️  Não há ${dist.position === -1 ? 'último' : dist.position + 'º'} lugar (poucos participantes)`);
        continue;
      }

      const team = rankedTeams[teamIndex];
      const prizeAmount = (prizePool * dist.percentage) / 100;

      // Criar registro de prêmio
      await prisma.prizeClaim.create({
        data: {
          userId: team.userId,
          competitionId: competitionId,
          amount: prizeAmount,
          position: dist.position,
          prizeType: 'ROUND_PRIZE',
          claimed: false
        }
      });

      const positionLabel = dist.position === -1 ? 'Último' : `${dist.position}º`;

      console.log(`   ${dist.emoji} ${positionLabel} lugar: ${team.teamName} (${team.userName})`);
      console.log(`      Pontos: ${team.points.toFixed(2)}`);
      console.log(`      Prêmio: ${prizeAmount.toFixed(2)} SOL (${dist.percentage}%)`);
      console.log();
    }

    // 5️⃣ MARCAR COMO DISTRIBUÍDO
    await prisma.competition.update({
      where: { id: competitionId },
      data: { distributed: true }
    });

    console.log('   ' + '='.repeat(70));
    console.log(`   ✅ Prêmios da rodada registrados para claim!`);
    console.log(`   💎 Total distribuído: ${prizePool.toFixed(2)} SOL`);

  } catch (error) {
    console.error('   ❌ Erro ao distribuir prêmios:', error);
    throw error;
  }
}

/**
 * Distribui prêmios de uma temporada (Season)
 */
async function distributeSeasonPrizes(seasonId) {
  console.log(`\n🏆 Distribuindo prêmios da temporada ${seasonId}...`);

  try {
    // 1️⃣ BUSCAR TEMPORADA E RANKINGS
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        seasonRankings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!season) {
      throw new Error('Temporada não encontrada');
    }

    const prizePool = parseFloat(season.prizePool);

    if (prizePool === 0) {
      console.log('   ⚠️  Nenhum prêmio acumulado nesta temporada');
      return;
    }

    // 2️⃣ ORDENAR POR PONTUAÇÃO ACUMULADA
    const rankedPlayers = season.seasonRankings
      .map(ranking => ({
        userId: ranking.userId,
        userName: ranking.user.name || ranking.user.email,
        points: parseFloat(ranking.totalSeasonPoints)
      }))
      .sort((a, b) => b.points - a.points);

    if (rankedPlayers.length === 0) {
      console.log('   ⚠️  Nenhum jogador participou desta temporada');
      return;
    }

    console.log(`   🏆 Prize Pool: ${prizePool} SOL`);
    console.log(`   👥 Participantes: ${rankedPlayers.length}`);

    // 3️⃣ CALCULAR DISTRIBUIÇÃO (mesma lógica)
    const distribution = [
      { position: 1, percentage: 50, emoji: '🥇' },
      { position: 2, percentage: 25, emoji: '🥈' },
      { position: 3, percentage: 15, emoji: '🥉' },
      { position: -1, percentage: 10, emoji: '🎖️' }
    ];

    console.log('\n   📊 DISTRIBUIÇÃO DA TEMPORADA:');
    console.log('   ' + '='.repeat(70));

    // 4️⃣ CRIAR PRIZE CLAIMS
    for (const dist of distribution) {
      let playerIndex;

      if (dist.position === -1) {
        playerIndex = rankedPlayers.length - 1;
      } else {
        playerIndex = dist.position - 1;
      }

      if (playerIndex >= rankedPlayers.length) {
        console.log(`   ⚠️  Não há ${dist.position === -1 ? 'último' : dist.position + 'º'} lugar (poucos participantes)`);
        continue;
      }

      const player = rankedPlayers[playerIndex];
      const prizeAmount = (prizePool * dist.percentage) / 100;

      await prisma.prizeClaim.create({
        data: {
          userId: player.userId,
          seasonId: seasonId,
          amount: prizeAmount,
          position: dist.position,
          prizeType: 'SEASON_PRIZE',
          claimed: false
        }
      });

      const positionLabel = dist.position === -1 ? 'Último' : `${dist.position}º`;

      console.log(`   ${dist.emoji} ${positionLabel} lugar: ${player.userName}`);
      console.log(`      Pontos: ${player.points.toFixed(2)}`);
      console.log(`      Prêmio: ${prizeAmount.toFixed(2)} SOL (${dist.percentage}%)`);
      console.log();
    }

    // 5️⃣ MARCAR TEMPORADA COMO COMPLETA
    await prisma.season.update({
      where: { id: seasonId },
      data: { status: 'COMPLETED' }
    });

    console.log('   ' + '='.repeat(70));
    console.log(`   ✅ Prêmios da temporada registrados para claim!`);
    console.log(`   💎 Total distribuído: ${prizePool.toFixed(2)} SOL`);

  } catch (error) {
    console.error('   ❌ Erro ao distribuir prêmios da temporada:', error);
    throw error;
  }
}

module.exports = {
  distributeRoundPrizes,
  distributeSeasonPrizes
};

// Se executado diretamente (para testes)
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Uso:');
    console.log('  node distribute-prizes.js round <competitionId>');
    console.log('  node distribute-prizes.js season <seasonId>');
    process.exit(1);
  }

  const [type, id] = args;

  (async () => {
    try {
      if (type === 'round') {
        await distributeRoundPrizes(id);
      } else if (type === 'season') {
        await distributeSeasonPrizes(id);
      } else {
        console.error('Tipo inválido. Use "round" ou "season"');
        process.exit(1);
      }
      await prisma.$disconnect();
    } catch (error) {
      console.error('Erro:', error);
      await prisma.$disconnect();
      process.exit(1);
    }
  })();
}
