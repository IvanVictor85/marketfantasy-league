const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const leagueId = 'cmh3qcrw80000cjvdrwtvt65i'; // Liga Principal

    console.log('🧪 Testando Sistema de Inscrição em Rodadas\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. Listar competições da liga
    const competitions = await prisma.competition.findMany({
      where: { leagueId },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true
      }
    });

    console.log('📋 RODADAS DA LIGA:\n');
    competitions.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Início: ${new Date(c.startDate).toLocaleString('pt-BR')}`);
      console.log(`   Fim: ${new Date(c.endDate).toLocaleString('pt-BR')}`);
      console.log('');
    });

    // 2. Verificar participantes em cada rodada
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('👥 PARTICIPANTES POR RODADA:\n');

    for (const comp of competitions) {
      const participants = await prisma.userTeam.findMany({
        where: { competitionId: comp.id },
        include: {
          user: {
            select: { name: true }
          }
        }
      });

      console.log(`${comp.name || 'Rodada'}:`);
      console.log(`  Status: ${comp.status}`);
      console.log(`  Participantes: ${participants.length}`);

      if (participants.length > 0) {
        participants.forEach(p => {
          console.log(`    - ${p.user.name}: ${p.teamName}`);
        });
      } else {
        console.log(`    (nenhum participante)`);
      }
      console.log('');
    }

    // 3. Verificar quais usuários PODEM se inscrever
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🎯 ANÁLISE DE ELEGIBILIDADE:\n');

    const leagueEntries = await prisma.leagueEntry.findMany({
      where: { leagueId },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    console.log(`Total de usuários na liga: ${leagueEntries.length}\n`);

    // Verificar rodadas UPCOMING
    const upcomingCompetitions = competitions.filter(c => c.status === 'UPCOMING');

    if (upcomingCompetitions.length === 0) {
      console.log('⚠️ Não há rodadas UPCOMING no momento.\n');
    } else {
      console.log(`Rodadas UPCOMING disponíveis: ${upcomingCompetitions.length}\n`);

      for (const comp of upcomingCompetitions) {
        console.log(`📍 ${comp.name}:`);

        // Contar quantos usuários JÁ estão inscritos
        const enrolled = await prisma.userTeam.findMany({
          where: { competitionId: comp.id },
          select: { userId: true }
        });

        const enrolledUserIds = new Set(enrolled.map(e => e.userId));

        // Contar quantos podem se inscrever (na liga mas não na rodada)
        const canEnroll = leagueEntries.filter(entry => !enrolledUserIds.has(entry.userId));

        console.log(`  ✅ Inscritos: ${enrolled.length}`);
        console.log(`  ⏳ Podem se inscrever: ${canEnroll.length}`);

        if (canEnroll.length > 0) {
          console.log('  Usuários que podem se inscrever:');
          canEnroll.slice(0, 5).forEach(entry => {
            console.log(`    - ${entry.user.name}`);
          });
          if (canEnroll.length > 5) {
            console.log(`    ... e mais ${canEnroll.length - 5}`);
          }
        }
        console.log('');
      }
    }

    // 4. Estatísticas Finais
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 RESUMO:\n');

    const totalParticipations = await prisma.userTeam.count({
      where: {
        competition: { leagueId }
      }
    });

    console.log(`Total de usuários na liga: ${leagueEntries.length}`);
    console.log(`Total de rodadas: ${competitions.length}`);
    console.log(`  - ACTIVE: ${competitions.filter(c => c.status === 'ACTIVE').length}`);
    console.log(`  - UPCOMING: ${competitions.filter(c => c.status === 'UPCOMING').length}`);
    console.log(`  - COMPLETED: ${competitions.filter(c => c.status === 'COMPLETED').length}`);
    console.log(`Total de inscrições em rodadas: ${totalParticipations}\n`);

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('💡 PRÓXIMOS PASSOS:\n');
    console.log('1. Usuários devem ir em /teams');
    console.log('2. Selecionar a liga');
    console.log('3. Ver a seção "Rodadas da Liga"');
    console.log('4. Clicar em "Inscrever-se" nas rodadas UPCOMING');
    console.log('5. Seu time será copiado automaticamente para a nova rodada\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
