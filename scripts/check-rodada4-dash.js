/**
 * 🔍 VERIFICAR DASH NA RODADA 4
 *
 * Verifica se DASH está no time da Rodada 4 e como está sendo exibido
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodada4Id = 'cmicalux3000810oueqd2dkax';

async function checkDashInRodada4() {
  console.log('\n🔍 VERIFICANDO DASH NA RODADA 4\n');
  console.log('='.repeat(80));

  try {
    // Buscar todos os times da Rodada 4
    const teams = await prisma.userTeam.findMany({
      where: { competitionId: rodada4Id },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    console.log(`\n📊 Times na Rodada 4: ${teams.length}\n`);

    // Buscar times que têm DASH
    const teamsWithDash = teams.filter(team => {
      if (!Array.isArray(team.players)) return false;
      return team.players.some(symbol => symbol.toUpperCase() === 'DASH');
    });

    console.log(`🎯 Times com DASH: ${teamsWithDash.length}\n`);

    if (teamsWithDash.length > 0) {
      teamsWithDash.forEach(team => {
        console.log(`\n📋 Time: ${team.teamName || 'Sem nome'}`);
        console.log(`   Usuário: ${team.user.username || team.user.email}`);
        console.log(`   Jogadores:`, team.players);
        console.log(`   DASH está na posição: ${team.players.indexOf('DASH') + 1}`);
      });
    } else {
      console.warn('⚠️ Nenhum time com DASH encontrado!');
    }

    // Verificar CompetitionTokens da Rodada 4
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 VERIFICANDO COMPETITION TOKENS\n');

    const dashToken = await prisma.competitionToken.findFirst({
      where: {
        competitionId: rodada4Id,
        symbol: 'DASH'
      }
    });

    if (dashToken) {
      console.log('✅ DASH encontrado em CompetitionToken:');
      console.log(`   Symbol: ${dashToken.symbol}`);
      console.log(`   Price Start: ${dashToken.priceStart}`);
      console.log(`   Price Start Date: ${dashToken.priceStartDate}`);
      console.log(`   Price End: ${dashToken.priceEnd}`);
      console.log(`   Percent Change: ${dashToken.percentChange}`);
    } else {
      console.log('❌ DASH NÃO encontrado em CompetitionToken');
    }

    // Verificar competição
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 INFORMAÇÕES DA RODADA 4\n');

    const competition = await prisma.competition.findUnique({
      where: { id: rodada4Id }
    });

    if (competition) {
      console.log(`Nome: ${competition.name}`);
      console.log(`Status: ${competition.status}`);
      console.log(`Start Date: ${competition.startDate}`);
      console.log(`End Date: ${competition.endDate}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Verificação concluída!\n');
}

checkDashInRodada4();
