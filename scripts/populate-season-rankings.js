/**
 * 📊 POPULAR SEASON RANKINGS RETROATIVAMENTE
 *
 * Calcula e popula os rankings da temporada com base nas
 * rodadas 1, 2 e 3 que já foram finalizadas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seasonId = 'cmicalu8a000010ouykcpw7b6'; // Temporada 1 - Testes

const completedRounds = [
  { id: 'cmicalugq000210ou5ri809wa', name: 'Rodada 1' },
  { id: 'cmicaluov000410ouj4ywkwop', name: 'Rodada 2' },
  { id: 'cmicalusz000610ousgsnhr2z', name: 'Rodada 3' }
];

async function populateSeasonRankings() {
  console.log('\n📊 POPULANDO SEASON RANKINGS RETROATIVAMENTE\n');
  console.log('='.repeat(80));

  try {
    // 1. Limpar rankings existentes (se houver)
    console.log('\n🗑️ Limpando rankings existentes...\n');

    const deleted = await prisma.seasonRanking.deleteMany({
      where: { seasonId: seasonId }
    });

    console.log(`✅ ${deleted.count} rankings removidos\n`);

    // 2. Processar cada rodada
    console.log('='.repeat(80));
    console.log('\n📝 PROCESSANDO RODADAS COMPLETADAS:\n');

    for (const round of completedRounds) {
      console.log(`\n${round.name} (${round.id}):\n`);

      // Buscar times da rodada
      const userTeams = await prisma.userTeam.findMany({
        where: { competitionId: round.id },
        include: {
          user: {
            select: {
              username: true,
              email: true
            }
          }
        }
      });

      console.log(`   Times encontrados: ${userTeams.length}`);

      // Atualizar SeasonRanking para cada usuário
      let updated = 0;
      for (const team of userTeams) {
        await prisma.seasonRanking.upsert({
          where: {
            userId_seasonId: {
              userId: team.userId,
              seasonId: seasonId
            }
          },
          update: {
            totalSeasonPoints: {
              increment: Number(team.totalPoints)
            },
            updatedAt: new Date()
          },
          create: {
            userId: team.userId,
            seasonId: seasonId,
            totalSeasonPoints: Number(team.totalPoints)
          }
        });

        updated++;

        if (updated <= 3) {
          console.log(`      ✅ ${team.user.username || team.user.email}: +${Number(team.totalPoints).toFixed(2)} pts`);
        }
      }

      if (updated > 3) {
        console.log(`      ... e mais ${updated - 3} usuários`);
      }

      console.log(`   ✅ ${updated} rankings atualizados`);
    }

    // 3. Exibir ranking final
    console.log('\n' + '='.repeat(80));
    console.log('\n🏆 RANKING FINAL DA TEMPORADA (após Rodadas 1, 2 e 3):\n');

    const rankings = await prisma.seasonRanking.findMany({
      where: { seasonId: seasonId },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        totalSeasonPoints: 'desc'
      }
    });

    rankings.forEach((rank, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      const position = (index + 1).toString().padStart(2, ' ');
      const name = (rank.user.username || rank.user.email).padEnd(30, ' ');
      const points = Number(rank.totalSeasonPoints).toFixed(2).padStart(8, ' ');

      console.log(`${medal} ${position}º - ${name} - ${points} pts`);
    });

    // 4. Estatísticas
    const scores = rankings.map(r => Number(r.totalSeasonPoints));
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 ESTATÍSTICAS DA TEMPORADA:\n');
    console.log(`   🏆 Maior pontuação: ${maxScore.toFixed(2)} pts`);
    console.log(`   📉 Menor pontuação: ${minScore.toFixed(2)} pts`);
    console.log(`   📊 Pontuação média: ${avgScore.toFixed(2)} pts`);
    console.log(`   📈 Amplitude: ${(maxScore - minScore).toFixed(2)} pts`);
    console.log(`   👥 Total de jogadores: ${rankings.length}`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('='.repeat(80));
  console.log('\n✅ População de rankings concluída!\n');
}

populateSeasonRankings();
