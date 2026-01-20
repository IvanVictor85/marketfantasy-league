const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetRoundsDates() {
  console.log('🔄 Resetando datas das Rodadas 1-4...\n');

  // Data base: 02/12/2025 às 21:00 (horário de Brasília = 00:00 UTC do dia 03/12)
  const baseDate = new Date('2025-12-03T00:00:00.000Z'); // 02/12 21h BRT = 03/12 00h UTC

  const rounds = [
    {
      name: 'Rodada 1',
      id: 'cmicalugq000210ou5ri809wa',
      offset: 0 // Começa no dia base
    },
    {
      name: 'Rodada 2',
      id: 'cmicaluov000410ouj4ywkwop',
      offset: 1 // +24h
    },
    {
      name: 'Rodada 3',
      id: 'cmicalusz000610ousgsnhr2z',
      offset: 2 // +48h
    },
    {
      name: 'Rodada 4',
      id: 'cmicalux3000810oueqd2dkax',
      offset: 3 // +72h
    }
  ];

  for (const round of rounds) {
    // Calcular datas
    const startDate = new Date(baseDate);
    startDate.setUTCDate(startDate.getUTCDate() + round.offset);

    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1); // +24h

    // Formatar para exibição em BRT (UTC-3)
    const formatBRT = (date) => {
      const brt = new Date(date.getTime() - 3 * 60 * 60 * 1000);
      return brt.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    console.log(`📅 ${round.name}:`);
    console.log(`   Início: ${formatBRT(startDate)} BRT`);
    console.log(`   Fim: ${formatBRT(endDate)} BRT`);

    // Atualizar no banco
    await prisma.competition.update({
      where: { id: round.id },
      data: {
        startDate: startDate,
        endDate: endDate,
        status: 'PENDING' // Resetar status para PENDING
      }
    });

    // Limpar dados de snapshot anteriores
    await prisma.competitionToken.updateMany({
      where: { competitionId: round.id },
      data: {
        priceStart: null,
        priceStartDate: null,
        priceEnd: null,
        priceEndDate: null,
        percentChange: null
      }
    });

    console.log(`   ✅ Atualizado (status: PENDING, snapshots limpos)\n`);
  }

  console.log('✅ Todas as rodadas foram resetadas!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. As rodadas estão PENDING e prontas para aceitar inscrições');
  console.log('   2. Quando a Rodada 1 começar (02/12 21h), rodar: node scripts/snapshot-initial.js');
  console.log('   3. Quando terminar (03/12 21h), rodar: node scripts/snapshot-final.js');

  await prisma.$disconnect();
}

resetRoundsDates().catch(console.error);
