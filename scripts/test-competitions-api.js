const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCompetitionsAPI() {
  try {
    console.log('🔍 Testando API de competições...\n');

    // Buscar liga principal
    const league = await prisma.league.findFirst({
      where: { name: 'Liga Principal MarketFantasy' }
    });

    if (!league) {
      console.log('❌ Liga Principal não encontrada');
      return;
    }

    console.log(`✅ Liga encontrada: ${league.name} (${league.id})\n`);

    // Buscar competições da liga
    const competitions = await prisma.competition.findMany({
      where: { leagueId: league.id },
      include: {
        season: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    console.log(`📋 Total de competições encontradas: ${competitions.length}\n`);

    // Formatar e exibir competições
    const formattedCompetitions = competitions.map((comp, index) => {
      const statusEmoji =
        comp.status === 'COMPLETED' ? '✅' :
        comp.status === 'ACTIVE' ? '🔴' :
        comp.status === 'PENDING' ? '⏳' : '❓';

      console.log(`${index + 1}. ${statusEmoji} ${comp.name || 'Sem nome'}`);
      console.log(`   ID: ${comp.id}`);
      console.log(`   Status: ${comp.status}`);
      console.log(`   Temporada: ${comp.season?.name || 'Sem temporada'}`);
      console.log(`   Início: ${comp.startDate?.toLocaleString('pt-BR') || 'Não definido'}`);
      console.log(`   Fim: ${comp.endDate?.toLocaleString('pt-BR') || 'Não definido'}`);
      console.log('');

      return {
        id: comp.id,
        name: comp.name || 'Rodada sem nome',
        startDate: comp.startDate?.toISOString() || '',
        endDate: comp.endDate?.toISOString() || '',
        status: comp.status,
        seasonId: comp.season?.id || null,
        seasonName: comp.season?.name || 'Sem temporada'
      };
    });

    console.log('\n📊 Formato para a API:');
    console.log(JSON.stringify({
      success: true,
      league: {
        id: league.id,
        name: league.name
      },
      competitions: formattedCompetitions
    }, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompetitionsAPI();
