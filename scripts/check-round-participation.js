const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Verificando sistema de entrada em rodadas...\n');

    // Verificar LeagueEntry (entrada na liga)
    const leagueEntries = await prisma.leagueEntry.findMany({
      where: {
        leagueId: 'cmh3qcrw80000cjvdrwtvt65i'
      }
    });

    console.log('📊 ENTRADAS NA LIGA PRINCIPAL:');
    console.log('   Total:', leagueEntries.length, 'usuários');
    console.log('');

    // Buscar todas as competições
    const competitions = await prisma.competition.findMany({
      where: {
        leagueId: 'cmh3qcrw80000cjvdrwtvt65i'
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log('📅 RODADAS DA LIGA:');
    competitions.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.status})`);
    });
    console.log('');

    // Verificar UserTeams por rodada
    for (const comp of competitions) {
      const teams = await prisma.userTeam.findMany({
        where: { competitionId: comp.id },
        select: {
          user: { select: { name: true } }
        }
      });

      console.log(`⚽ ${comp.name || 'Rodada'}:`);
      console.log(`   Status: ${comp.status}`);
      console.log(`   Times inscritos: ${teams.length}`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('💡 FLUXO ATUAL:');
    console.log('');
    console.log('1️⃣  Usuário ENTRA na LIGA');
    console.log('    → Paga taxa de entrada');
    console.log('    → Cria registro em LeagueEntry');
    console.log('');
    console.log('2️⃣  Usuário vai em /teams');
    console.log('    → Seleciona a liga');
    console.log('    → Monta/edita seu time');
    console.log('    → Salva');
    console.log('');
    console.log('3️⃣  Sistema cria UserTeam');
    console.log('    → Vincula ao competitionId atual');
    console.log('    → Time fica inscrito na RODADA');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  PROBLEMA IDENTIFICADO:');
    console.log('');
    console.log('Não há UI/sistema para:');
    console.log('  ❌ Ver em quais rodadas você está inscrito');
    console.log('  ❌ Inscrever-se em rodadas futuras (UPCOMING)');
    console.log('  ❌ Escolher em quais rodadas participar');
    console.log('  ❌ Ver status de inscrição por rodada');
    console.log('');
    console.log('COMPORTAMENTO ATUAL:');
    console.log('  → Quando salva time, ele vai para a rodada da liga selecionada');
    console.log('  → Não há escolha de rodada específica');
    console.log('  → Não há inscrição automática em todas as rodadas');
    console.log('');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
