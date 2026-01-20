const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔧 Atualizando datas das rodadas para teste...\n');

    // Buscar todas as competições
    const competitions = await prisma.competition.findMany({
      where: {
        league: {
          name: 'Liga Principal MarketFantasy'
        }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        status: true
      }
    });

    console.log('Total de competições encontradas:', competitions.length);

    // Filtrar apenas as 4 rodadas principais (excluir a "Rodada Teste")
    const mainRounds = competitions.filter(c =>
      c.name && c.name.startsWith('Rodada') && !c.name.includes('Teste')
    );

    console.log('Rodadas principais a atualizar:', mainRounds.length, '\n');

    if (mainRounds.length !== 4) {
      console.log('⚠️ Esperava 4 rodadas, encontrei:', mainRounds.length);
      console.log('Rodadas encontradas:', mainRounds.map(r => r.name));
      await prisma.$disconnect();
      return;
    }

    // Configurar datas
    // Horário base: 21:00 (9 PM)
    const baseHour = 21;

    // Rodada 1: Do snapshot de ontem (23/11 21h) até amanhã (25/11 21h)
    const round1Start = new Date('2025-11-23T21:00:00.000Z');
    const round1End = new Date('2025-11-25T21:00:00.000Z');

    // Rodada 2: 25/11 21h até 26/11 21h
    const round2Start = new Date('2025-11-25T21:00:00.000Z');
    const round2End = new Date('2025-11-26T21:00:00.000Z');

    // Rodada 3: 26/11 21h até 27/11 21h
    const round3Start = new Date('2025-11-26T21:00:00.000Z');
    const round3End = new Date('2025-11-27T21:00:00.000Z');

    // Rodada 4: 27/11 21h até 28/11 21h
    const round4Start = new Date('2025-11-27T21:00:00.000Z');
    const round4End = new Date('2025-11-28T21:00:00.000Z');

    const updates = [
      { round: mainRounds[0], start: round1Start, end: round1End, status: 'ACTIVE' },
      { round: mainRounds[1], start: round2Start, end: round2End, status: 'UPCOMING' },
      { round: mainRounds[2], start: round3Start, end: round3End, status: 'UPCOMING' },
      { round: mainRounds[3], start: round4Start, end: round4End, status: 'UPCOMING' }
    ];

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                   ATUALIZAÇÕES PLANEJADAS');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const update of updates) {
      console.log(`📍 ${update.round.name}`);
      console.log(`   Status: ${update.round.status} → ${update.status}`);
      console.log(`   Início: ${update.start.toLocaleString('pt-BR')}`);
      console.log(`   Fim: ${update.end.toLocaleString('pt-BR')}`);
      console.log(`   Duração: 24 horas`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    // Executar atualizações
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];

      console.log(`Atualizando ${update.round.name}...`);

      await prisma.competition.update({
        where: { id: update.round.id },
        data: {
          startDate: update.start,
          endDate: update.end,
          status: update.status
        }
      });

      console.log(`✅ ${update.round.name} atualizada!`);
    }

    console.log('\n✅ Todas as rodadas atualizadas com sucesso!\n');

    // Verificar resultado
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                   VERIFICAÇÃO FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');

    const updated = await prisma.competition.findMany({
      where: {
        id: { in: mainRounds.map(r => r.id) }
      },
      orderBy: { startDate: 'asc' },
      select: {
        name: true,
        status: true,
        startDate: true,
        endDate: true
      }
    });

    const now = new Date();
    console.log('Hora atual:', now.toLocaleString('pt-BR'), '\n');

    updated.forEach(c => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);

      let timeStatus = '';
      if (now < start) {
        const hoursUntil = Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60));
        timeStatus = `⏳ Começa em ${hoursUntil}h`;
      } else if (now >= start && now <= end) {
        timeStatus = '🔴 EM ANDAMENTO';
      } else {
        timeStatus = '✅ Finalizada';
      }

      console.log(`📍 ${c.name}`);
      console.log(`   Status DB: ${c.status}`);
      console.log(`   Período: ${start.toLocaleString('pt-BR')} até ${end.toLocaleString('pt-BR')}`);
      console.log(`   ${timeStatus}`);
      console.log('');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
