const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWhatHappened() {
  try {
    console.log('🔍 Verificando o que aconteceu com a Rodada 4...\n');

    const rodada4Id = 'cmicalux3000810oueqd2dkax';

    const competition = await prisma.competition.findUnique({
      where: { id: rodada4Id },
      include: {
        _count: {
          select: {
            userTeams: true
          }
        }
      }
    });

    if (!competition) {
      console.log('❌ Rodada 4 não encontrada!');
      return;
    }

    console.log('📋 Status da Rodada 4:');
    console.log('═══════════════════════════════════════');
    console.log(`Nome: ${competition.name}`);
    console.log(`Status: ${competition.status}`);
    console.log(`Início: ${competition.startDate.toLocaleString('pt-BR')}`);
    console.log(`Fim: ${competition.endDate.toLocaleString('pt-BR')}`);
    console.log(`Times: ${competition._count.userTeams}`);
    console.log('');

    const now = new Date();
    console.log(`⏰ Data/Hora Atual: ${now.toLocaleString('pt-BR')}`);
    console.log('');

    if (competition.endDate > now) {
      const timeLeft = competition.endDate - now;
      const minutesLeft = Math.floor(timeLeft / (1000 * 60));
      console.log(`⏱️  Tempo restante: ${minutesLeft} minutos`);
      console.log(`📅 Finalização prevista: ${competition.endDate.toLocaleString('pt-BR')}`);
    } else {
      const timePassed = now - competition.endDate;
      const minutesPassed = Math.floor(timePassed / (1000 * 60));
      console.log(`⚠️  Já passou do horário de término!`);
      console.log(`⏰ Deveria ter finalizado há ${minutesPassed} minutos`);
    }

    console.log('');
    console.log('🎯 Verificando se deveria finalizar agora:');
    console.log('───────────────────────────────────────');
    console.log(`Status é ACTIVE? ${competition.status === 'ACTIVE' ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`endDate <= agora? ${competition.endDate <= now ? '✅ SIM' : '❌ NÃO'}`);
    console.log('');

    if (competition.status === 'ACTIVE' && competition.endDate <= now) {
      console.log('🚀 DEVERIA FINALIZAR AGORA!');
      console.log('');
      console.log('💡 Você pode finalizar manualmente com:');
      console.log(`   node scripts/snapshot-final.js ${rodada4Id}`);
    } else if (competition.status === 'COMPLETED') {
      console.log('✅ Já foi finalizada!');
    } else {
      console.log('⏳ Ainda não chegou a hora de finalizar.');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWhatHappened();
