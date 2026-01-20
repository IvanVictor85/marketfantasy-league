const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🔄 SCRIPT PARA ZERAR RODADAS E CRIAR RODADA DE TESTE
 *
 * 1. Zera todas as competições/rodadas da liga principal
 * 2. Cria uma rodada de teste configurada:
 *    - Início: Hoje (Domingo) 21h BR
 *    - Fim: Sexta-feira 21h BR
 *    - Status: ACTIVE
 */

async function resetAndCreateTestRound() {
  console.log('🔄 RESETANDO RODADAS E CRIANDO ESTRUTURA DE TESTE\n');
  console.log('='.repeat(80));

  try {
    // 1️⃣ BUSCAR LIGA PRINCIPAL
    console.log('\n1️⃣ Buscando liga principal...');

    const mainLeague = await prisma.league.findFirst({
      where: {
        name: { contains: 'Principal', mode: 'insensitive' }
      }
    });

    if (!mainLeague) {
      console.log('❌ Liga principal não encontrada!');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Liga encontrada: ${mainLeague.name} (${mainLeague.id})`);

    // 2️⃣ DELETAR TODAS AS COMPETIÇÕES DA LIGA
    console.log('\n2️⃣ Deletando todas as competições existentes...');

    const deleteResult = await prisma.competition.deleteMany({
      where: { leagueId: mainLeague.id }
    });

    console.log(`✅ ${deleteResult.count} competições deletadas`);

    // 3️⃣ CALCULAR DATAS (Fuso Horário Brasil = UTC-3)
    console.log('\n3️⃣ Calculando datas da rodada de teste...');

    // Hoje é domingo, vamos configurar para 21h BR (00h UTC do dia seguinte)
    const now = new Date();

    // Início: Hoje às 21h BR = Amanhã 00h UTC
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0); // Meia-noite UTC (21h BR do dia anterior)
    startDate.setUTCDate(startDate.getUTCDate() + 1); // Adiciona 1 dia para compensar

    // Fim: Sexta-feira às 21h BR = Sábado 00h UTC
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 5); // 5 dias depois (Dom -> Sex)

    console.log(`   Início: ${startDate.toISOString()} (21h BR Domingo)`);
    console.log(`   Fim: ${endDate.toISOString()} (21h BR Sexta)`);

    // 4️⃣ CRIAR RODADA DE TESTE
    console.log('\n4️⃣ Criando rodada de teste...');

    const testCompetition = await prisma.competition.create({
      data: {
        name: 'Rodada Teste - Semana 1',
        leagueId: mainLeague.id,
        startDate: startDate,
        endDate: endDate,
        status: 'ACTIVE',
        prizePool: 0,
        distributed: false
      }
    });

    console.log(`✅ Rodada criada: ${testCompetition.name}`);
    console.log(`   ID: ${testCompetition.id}`);
    console.log(`   Status: ${testCompetition.status}`);

    // 5️⃣ POPULAR TOKENS DA COMPETIÇÃO
    console.log('\n5️⃣ Populando tokens da competição...');

    // Buscar tokens ativos da liga
    const leagueTokens = await prisma.leaguePlayer.findMany({
      where: { leagueId: mainLeague.id },
      include: { token: true }
    });

    console.log(`   Encontrados ${leagueTokens.length} tokens na liga`);

    if (leagueTokens.length > 0) {
      // Criar CompetitionTokens
      for (const lt of leagueTokens) {
        await prisma.competitionToken.create({
          data: {
            competitionId: testCompetition.id,
            tokenId: lt.token.coingeckoId,
            symbol: lt.token.symbol,
            name: lt.token.name,
            imageUrl: lt.token.logoUrl || '',
            marketCapRank: null,
            // Snapshots serão preenchidos quando executar o snapshot
            priceStart: null,
            priceStartDate: null,
            priceEnd: null,
            priceEndDate: null,
            percentChange: null
          }
        });
      }

      console.log(`   ✅ ${leagueTokens.length} tokens adicionados à competição`);
    }

    // 6️⃣ CRIAR ENTRADA PARA USUÁRIOS COM mainTeam
    console.log('\n6️⃣ Criando entradas para usuários com time template...');

    const usersWithTeam = await prisma.user.findMany({
      where: { mainTeam: { not: null } }
    });

    console.log(`   Encontrados ${usersWithTeam.length} usuários com time template`);

    let createdTeams = 0;
    for (const user of usersWithTeam) {
      const mainTeam = user.mainTeam;
      let tokens = [];

      if (Array.isArray(mainTeam)) {
        tokens = mainTeam;
      } else if (typeof mainTeam === 'object' && mainTeam !== null) {
        tokens = mainTeam.tokens || mainTeam.players || [];
      }

      if (tokens.length > 0) {
        await prisma.userTeam.create({
          data: {
            userId: user.id,
            competitionId: testCompetition.id,
            players: tokens,
            teamName: user.name || `Time de ${user.email}`,
            totalPoints: 0
          }
        });

        console.log(`   ✅ ${user.name || user.email} - Time criado com ${tokens.length} jogadores`);
        createdTeams++;
      }
    }

    // 7️⃣ RESUMO FINAL
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DA OPERAÇÃO:');
    console.log('='.repeat(80));
    console.log(`✅ Rodada de Teste criada: ${testCompetition.name}`);
    console.log(`   ID: ${testCompetition.id}`);
    console.log(`   Início: ${startDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`   Fim: ${endDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`   Status: ${testCompetition.status}`);
    console.log(`   Tokens disponíveis: ${leagueTokens.length}`);
    console.log(`   Times registrados: ${createdTeams}`);
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. O snapshot inicial deve ser executado no Domingo às 21h BR');
    console.log('   2. Isso gravará priceStart para todos os tokens');
    console.log('   3. O snapshot final deve ser executado na Sexta às 21h BR');
    console.log('   4. Isso gravará priceEnd e calculará percentChange');
    console.log('='.repeat(80));

    await prisma.$disconnect();

  } catch (error) {
    console.error('\n❌ ERRO:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Executar script
resetAndCreateTestRound();
