import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSeasonAlpha() {
  console.log('🚀 Criando Season Alpha...\n');

  try {
    // 1. Desativar temporadas anteriores
    await prisma.season.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'COMPLETED' }
    });
    console.log('✅ Temporadas anteriores desativadas');

    // 2. Criar Season Alpha
    const season = await prisma.season.create({
      data: {
        name: 'Season Alpha',
        startDate: new Date('2026-02-23T00:00:00.000Z'), // 22/02 21h BR
        endDate: new Date('2026-03-21T00:00:00.000Z'),   // 20/03 21h BR
        status: 'ACTIVE',
      }
    });
    console.log('✅ Season Alpha criada, ID:', season.id);

    // 3. Criar as 4 rodadas
    const roundsData = [
      { roundNumber: 1, name: 'Rodada 1', startTime: '2026-02-23T00:00:00.000Z', endTime: '2026-02-28T00:00:00.000Z' },
      { roundNumber: 2, name: 'Rodada 2', startTime: '2026-03-02T00:00:00.000Z', endTime: '2026-03-07T00:00:00.000Z' },
      { roundNumber: 3, name: 'Rodada 3', startTime: '2026-03-09T00:00:00.000Z', endTime: '2026-03-14T00:00:00.000Z' },
      { roundNumber: 4, name: 'Rodada 4', startTime: '2026-03-16T00:00:00.000Z', endTime: '2026-03-21T00:00:00.000Z' },
    ];

    for (const rd of roundsData) {
      const round = await prisma.round.create({
        data: {
          seasonId: season.id,
          roundNumber: rd.roundNumber,
          name: rd.name,
          startTime: new Date(rd.startTime),
          endTime: new Date(rd.endTime),
          entryFee: 0.025,
          prizePool: 0,
          status: 'PENDING',
        }
      });
      const startBR = new Date(round.startTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const endBR = new Date(round.endTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      console.log(`   ✅ ${round.name}: ${startBR} até ${endBR}`);
    }

    console.log('\n🎉 Season Alpha criada com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('   Temporada: Season Alpha');
    console.log('   Rodadas: 4');
    console.log('   Taxa de entrada: 0.025 SOL');
    console.log('   Período: 22/02 a 20/03/2026 (21h BR)');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSeasonAlpha();
