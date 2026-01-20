const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🗑️ SCRIPT PARA CANCELAR/LIMPAR TEMPORADA
 *
 * Use este script para resetar tudo durante testes.
 * ⚠️ ATENÇÃO: Remove TODOS os dados da temporada ativa!
 */

async function cancelSeason() {
  console.log('🗑️  CANCELANDO TEMPORADA ATIVA\n');
  console.log('='.repeat(80));

  try {
    // 1️⃣ BUSCAR TEMPORADA ATIVA
    console.log('\n1️⃣ Buscando temporada ativa...');

    const activeSeason = await prisma.season.findFirst({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'UPCOMING' }
        ]
      },
      include: {
        competitions: true
      }
    });

    if (!activeSeason) {
      console.log('✅ Nenhuma temporada ativa encontrada.');
      await prisma.$disconnect();
      return;
    }

    console.log(`⚠️  Temporada encontrada: ${activeSeason.name}`);
    console.log(`   ID: ${activeSeason.id}`);
    console.log(`   Rodadas: ${activeSeason.competitions.length}`);

    // 2️⃣ DELETAR COMPETITIONTOKENS
    console.log('\n2️⃣ Deletando CompetitionTokens...');

    const competitionIds = activeSeason.competitions.map(c => c.id);

    const deletedTokens = await prisma.competitionToken.deleteMany({
      where: {
        competitionId: { in: competitionIds }
      }
    });

    console.log(`✅ ${deletedTokens.count} CompetitionTokens deletados`);

    // 3️⃣ DELETAR USERTEAMS
    console.log('\n3️⃣ Deletando UserTeams das rodadas...');

    const deletedUserTeams = await prisma.userTeam.deleteMany({
      where: {
        competitionId: { in: competitionIds }
      }
    });

    console.log(`✅ ${deletedUserTeams.count} UserTeams deletados`);

    // 4️⃣ DELETAR LEAGUEENTRIES
    console.log('\n4️⃣ Deletando LeagueEntries (pagamentos)...');

    const deletedEntries = await prisma.leagueEntry.deleteMany({
      where: {
        competitionId: { in: competitionIds }
      }
    });

    console.log(`✅ ${deletedEntries.count} LeagueEntries deletados`);

    // 5️⃣ DELETAR SEASONRANKINGS
    console.log('\n5️⃣ Deletando SeasonRankings...');

    const deletedRankings = await prisma.seasonRanking.deleteMany({
      where: {
        seasonId: activeSeason.id
      }
    });

    console.log(`✅ ${deletedRankings.count} SeasonRankings deletados`);

    // 6️⃣ DELETAR COMPETITIONS
    console.log('\n6️⃣ Deletando Competitions (rodadas)...');

    const deletedCompetitions = await prisma.competition.deleteMany({
      where: {
        seasonId: activeSeason.id
      }
    });

    console.log(`✅ ${deletedCompetitions.count} Competitions deletadas`);

    // 7️⃣ DELETAR SEASON
    console.log('\n7️⃣ Deletando Season...');

    await prisma.season.delete({
      where: {
        id: activeSeason.id
      }
    });

    console.log(`✅ Season deletada: ${activeSeason.name}`);

    // 8️⃣ RESUMO
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEMPORADA CANCELADA COM SUCESSO!\n');
    console.log('📊 RESUMO DA LIMPEZA:');
    console.log('='.repeat(80));
    console.log(`CompetitionTokens: ${deletedTokens.count}`);
    console.log(`UserTeams: ${deletedUserTeams.count}`);
    console.log(`LeagueEntries: ${deletedEntries.count}`);
    console.log(`SeasonRankings: ${deletedRankings.count}`);
    console.log(`Competitions: ${deletedCompetitions.count}`);
    console.log(`Season: ${activeSeason.name}`);
    console.log();
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('   Você pode agora criar uma nova temporada:');
    console.log('   → node scripts/create-season.js');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERRO:', error);
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.$disconnect();
}

// Executar script
cancelSeason();
