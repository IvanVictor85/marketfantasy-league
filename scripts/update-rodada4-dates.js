const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRodada4Dates() {
  try {
    console.log('📅 Atualizando datas da Rodada 4 para período válido...\n');

    const rodada4Id = 'cmicalux3000810oueqd2dkax';

    // Definir datas válidas (hoje até amanhã, por exemplo)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(now.getHours() - 1); // Começou 1 hora atrás

    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 2); // Termina em 2 dias
    endDate.setHours(21, 0, 0, 0); // 21:00

    console.log('🕐 Início:', startDate.toLocaleString('pt-BR'));
    console.log('🕐 Fim:', endDate.toLocaleString('pt-BR'));
    console.log('');

    // Atualizar competição
    const updated = await prisma.competition.update({
      where: { id: rodada4Id },
      data: {
        startDate,
        endDate,
        status: 'ACTIVE'
      }
    });

    console.log('✅ Rodada 4 atualizada com sucesso!');
    console.log('   Nome:', updated.name);
    console.log('   Status:', updated.status);
    console.log('   Início:', updated.startDate.toLocaleString('pt-BR'));
    console.log('   Fim:', updated.endDate.toLocaleString('pt-BR'));

    // Atualizar status da temporada para ACTIVE também
    const season = await prisma.season.update({
      where: { id: 'cmicalu8a000010ouykcpw7b6' },
      data: {
        status: 'ACTIVE'
      }
    });

    console.log('\n✅ Temporada atualizada para ACTIVE');
    console.log('   Nome:', season.name);
    console.log('   Status:', season.status);

    console.log('\n🎯 Rodada 4 agora está ativa e com datas válidas!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRodada4Dates();
