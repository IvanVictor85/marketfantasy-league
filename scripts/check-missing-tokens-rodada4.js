/**
 * 🔍 VERIFICAR TOKENS FALTANTES NA RODADA 4
 *
 * Compara tokens nos times vs tokens em CompetitionToken
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodada4Id = 'cmicalux3000810oueqd2dkax';

async function checkMissingTokens() {
  console.log('\n🔍 VERIFICANDO TOKENS FALTANTES NA RODADA 4\n');
  console.log('='.repeat(80));

  try {
    // 1. Buscar todos os tokens únicos nos times
    const teams = await prisma.userTeam.findMany({
      where: { competitionId: rodada4Id },
      select: { players: true }
    });

    const tokensInTeams = new Set();
    teams.forEach(team => {
      if (Array.isArray(team.players)) {
        team.players.forEach(symbol => tokensInTeams.add(symbol.toUpperCase()));
      }
    });

    console.log(`\n📊 Tokens únicos nos times: ${tokensInTeams.size}`);
    console.log(`   Lista:`, Array.from(tokensInTeams).sort());

    // 2. Buscar tokens em CompetitionToken
    const competitionTokens = await prisma.competitionToken.findMany({
      where: { competitionId: rodada4Id },
      select: { symbol: true }
    });

    const tokensInCompetition = new Set(
      competitionTokens.map(t => t.symbol.toUpperCase())
    );

    console.log(`\n📊 Tokens em CompetitionToken: ${tokensInCompetition.size}`);
    console.log(`   Lista:`, Array.from(tokensInCompetition).sort());

    // 3. Encontrar diferença
    const missingTokens = Array.from(tokensInTeams).filter(
      token => !tokensInCompetition.has(token)
    );

    console.log('\n' + '='.repeat(80));

    if (missingTokens.length > 0) {
      console.log(`\n❌ TOKENS FALTANTES: ${missingTokens.length}\n`);
      missingTokens.forEach((token, i) => {
        console.log(`   ${i + 1}. ${token}`);
      });

      console.log('\n⚠️  Esses tokens estão em times mas não têm snapshot inicial!');
      console.log('    Isso causa o problema de aparecer 0.00 no dashboard.\n');
    } else {
      console.log('\n✅ Todos os tokens dos times estão em CompetitionToken!\n');
    }

    // 4. Verificar rodada 3 para comparação
    console.log('='.repeat(80));
    console.log('\n📊 COMPARAÇÃO COM RODADA 3\n');

    const rodada3Id = 'cmicalusz000610ousgsnhr2z';

    const rodada3Teams = await prisma.userTeam.findMany({
      where: { competitionId: rodada3Id },
      select: { players: true }
    });

    const tokensInRodada3 = new Set();
    rodada3Teams.forEach(team => {
      if (Array.isArray(team.players)) {
        team.players.forEach(symbol => tokensInRodada3.add(symbol.toUpperCase()));
      }
    });

    const rodada3Tokens = await prisma.competitionToken.findMany({
      where: { competitionId: rodada3Id },
      select: { symbol: true }
    });

    const tokensInCompRodada3 = new Set(
      rodada3Tokens.map(t => t.symbol.toUpperCase())
    );

    const missingInRodada3 = Array.from(tokensInRodada3).filter(
      token => !tokensInCompRodada3.has(token)
    );

    console.log(`Rodada 3 - Tokens nos times: ${tokensInRodada3.size}`);
    console.log(`Rodada 3 - Tokens em CompetitionToken: ${tokensInCompRodada3.size}`);
    console.log(`Rodada 3 - Faltantes: ${missingInRodada3.length}`);

    if (missingInRodada3.length > 0) {
      console.log(`   Lista:`, missingInRodada3);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Verificação concluída!\n');
}

checkMissingTokens();
