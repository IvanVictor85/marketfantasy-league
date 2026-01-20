const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setRodada4EndToday() {
  try {
    console.log('⏰ Ajustando Rodada 4 para finalizar hoje às 19:30...\n');

    const rodada4Id = 'cmicalux3000810oueqd2dkax';

    // Definir endDate para hoje às 19:30
    const endDate = new Date();
    endDate.setHours(19, 30, 0, 0);

    // Se já passou das 19:30 hoje, definir para amanhã 19:30
    if (new Date() > endDate) {
      console.log('⚠️ Já passou das 19:30 hoje. Definindo para amanhã às 19:30...');
      endDate.setDate(endDate.getDate() + 1);
    }

    console.log('📅 Nova data de término:', endDate.toLocaleString('pt-BR'));
    console.log('');

    // Atualizar competição
    const updated = await prisma.competition.update({
      where: { id: rodada4Id },
      data: {
        endDate,
        status: 'ACTIVE'
      }
    });

    console.log('✅ Rodada 4 atualizada com sucesso!');
    console.log('   Nome:', updated.name);
    console.log('   Status:', updated.status);
    console.log('   Início:', updated.startDate.toLocaleString('pt-BR'));
    console.log('   Fim:', updated.endDate.toLocaleString('pt-BR'));

    const now = new Date();
    const timeUntilEnd = endDate - now;
    const minutesUntilEnd = Math.floor(timeUntilEnd / (1000 * 60));

    console.log('\n⏱️  Tempo até o fim:', minutesUntilEnd, 'minutos');
    console.log('🎯 A rodada será finalizada automaticamente pelo cron local');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setRodada4EndToday();
