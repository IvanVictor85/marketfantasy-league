/**
 * 🔍 VERIFICAR STATUS DA SEASON (TEMPORADA)
 *
 * Verifica se há uma Season ativa e se está sendo atualizada
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSeasonStatus() {
  console.log('\n🔍 VERIFICANDO STATUS DA SEASON\n');
  console.log('='.repeat(80));

  try {
    // 1. Verificar se existem Seasons
    const seasons = await prisma.season.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: {
            competitions: true,
            seasonRankings: true
          }
        }
      }
    });

    console.log(`\n📊 Total de Seasons: ${seasons.length}\n`);

    if (seasons.length === 0) {
      console.log('❌ NENHUMA SEASON ENCONTRADA!');
      console.log('   É necessário criar uma Season antes de finalizar rodadas.\n');
    } else {
      seasons.forEach((season, index) => {
        console.log(`${index + 1}. ${season.name}`);
        console.log(`   ID: ${season.id}`);
        console.log(`   Status: ${season.status}`);
        console.log(`   Início: ${new Date(season.startDate).toLocaleDateString('pt-BR')}`);
        console.log(`   Fim: ${new Date(season.endDate).toLocaleDateString('pt-BR')}`);
        console.log(`   Prize Pool: ${Number(season.prizePool)} SOL`);
        console.log(`   Competições: ${season._count.competitions}`);
        console.log(`   Rankings: ${season._count.seasonRankings}`);
        console.log('');
      });
    }

    // 2. Verificar se competições estão linkadas a uma Season
    console.log('='.repeat(80));
    console.log('\n🔗 VERIFICANDO COMPETIÇÕES E SUAS SEASONS:\n');

    const competitions = await prisma.competition.findMany({
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        seasonId: true
      }
    });

    competitions.forEach(comp => {
      const hasSeasonLink = comp.seasonId ? '✅' : '❌';
      console.log(`${hasSeasonLink} ${comp.name || comp.id.substring(0, 8)} - ${comp.status} - Season: ${comp.seasonId || 'SEM LINK'}`);
    });

    const withoutSeason = competitions.filter(c => !c.seasonId).length;

    if (withoutSeason > 0) {
      console.log(`\n⚠️  ${withoutSeason} competições SEM LINK para Season!`);
    }

    // 3. Verificar SeasonRankings
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 VERIFICANDO SEASON RANKINGS:\n');

    const rankings = await prisma.seasonRanking.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        season: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        totalSeasonPoints: 'desc'
      },
      take: 10
    });

    if (rankings.length === 0) {
      console.log('❌ NENHUM RANKING DE SEASON ENCONTRADO!');
      console.log('   Rankings não estão sendo criados/atualizados.\n');
    } else {
      console.log(`Total de rankings: ${rankings.length}\n`);
      console.log('Top 10:\n');

      rankings.forEach((rank, index) => {
        console.log(`${index + 1}. ${rank.user.username || rank.user.email}`);
        console.log(`   Season: ${rank.season.name}`);
        console.log(`   Pontos: ${Number(rank.totalSeasonPoints).toFixed(2)}`);
        console.log('');
      });
    }

    // 4. Análise final
    console.log('='.repeat(80));
    console.log('\n📋 ANÁLISE FINAL:\n');

    const hasSeasons = seasons.length > 0;
    const hasActiveSeason = seasons.some(s => s.status === 'ACTIVE');
    const allCompsLinked = withoutSeason === 0;
    const hasRankings = rankings.length > 0;

    console.log(`✅ Tem Seasons criadas: ${hasSeasons ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Tem Season ATIVA: ${hasActiveSeason ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Todas competições linkadas: ${allCompsLinked ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Rankings sendo atualizados: ${hasRankings ? 'SIM' : 'NÃO'}`);

    console.log('\n💡 RECOMENDAÇÕES:\n');

    if (!hasSeasons) {
      console.log('   1. ❌ CRIAR uma Season (Temporada)');
    }

    if (!hasActiveSeason && hasSeasons) {
      console.log('   2. ⚠️  ATIVAR uma Season');
    }

    if (!allCompsLinked) {
      console.log('   3. ❌ LINKAR competições à Season ativa');
    }

    if (!hasRankings && hasSeasons) {
      console.log('   4. ❌ IMPLEMENTAR atualização automática de SeasonRanking ao finalizar rodadas');
    }

    if (hasSeasons && hasActiveSeason && allCompsLinked && hasRankings) {
      console.log('   ✅ Sistema de Season está COMPLETO e FUNCIONANDO!');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('='.repeat(80));
  console.log('\n✅ Verificação concluída!\n');
}

checkSeasonStatus();
