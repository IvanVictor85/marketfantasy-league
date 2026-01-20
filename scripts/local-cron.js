const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const prisma = new PrismaClient();

console.log('🕐 CRON LOCAL INICIADO');
console.log('═══════════════════════════════════════════════════════');
console.log('Este script simula os cron jobs do Vercel localmente.');
console.log('Ele verifica a cada 1 minuto se há competições para finalizar.');
console.log('═══════════════════════════════════════════════════════\n');

// Função para executar o snapshot final
async function executeSnapshotFinal(competitionId) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Executando snapshot final para competição ${competitionId}...\n`);

    exec(`node scripts/snapshot-final.js ${competitionId}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Erro ao executar snapshot: ${error}`);
        reject(error);
        return;
      }

      console.log(stdout);
      if (stderr) console.error(stderr);

      resolve();
    });
  });
}

// Verificar competições para finalizar
async function checkCompetitionsToEnd() {
  try {
    const now = new Date();
    console.log(`\n🔍 [${now.toLocaleTimeString('pt-BR')}] Verificando competições...`);

    // Buscar competições ACTIVE que já passaram da endDate
    const competitionsToEnd = await prisma.competition.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: now // endDate menor ou igual a agora
        }
      },
      select: {
        id: true,
        name: true,
        endDate: true,
        leagueId: true
      }
    });

    if (competitionsToEnd.length === 0) {
      console.log('   ✅ Nenhuma competição para finalizar no momento.');

      // Mostrar próxima competição a finalizar
      const nextToEnd = await prisma.competition.findFirst({
        where: {
          status: 'ACTIVE'
        },
        orderBy: {
          endDate: 'asc'
        },
        select: {
          name: true,
          endDate: true
        }
      });

      if (nextToEnd) {
        const timeUntilEnd = new Date(nextToEnd.endDate) - now;
        const minutesUntilEnd = Math.floor(timeUntilEnd / (1000 * 60));
        console.log(`   ⏱️  Próxima: ${nextToEnd.name} em ${minutesUntilEnd} minutos (${nextToEnd.endDate.toLocaleTimeString('pt-BR')})`);
      }

      return;
    }

    console.log(`\n🎯 Encontradas ${competitionsToEnd.length} competição(ões) para finalizar:\n`);

    for (const comp of competitionsToEnd) {
      console.log(`   📋 ${comp.name || 'Sem nome'}`);
      console.log(`   🕐 Término: ${comp.endDate.toLocaleString('pt-BR')}`);
      console.log(`   🆔 ID: ${comp.id}\n`);

      try {
        await executeSnapshotFinal(comp.id);
        console.log(`\n✅ ${comp.name} finalizada com sucesso!\n`);
      } catch (error) {
        console.error(`\n❌ Erro ao finalizar ${comp.name}:`, error, '\n');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao verificar competições:', error);
  }
}

// Executar imediatamente na primeira vez
console.log('🔄 Executando verificação inicial...');
checkCompetitionsToEnd().then(() => {
  console.log('\n✅ Verificação inicial concluída.');
  console.log('⏰ Próxima verificação em 1 minuto...\n');
});

// Configurar cron para executar a cada 1 minuto
// Formato: */1 * * * * = a cada 1 minuto
const task = cron.schedule('*/1 * * * *', async () => {
  await checkCompetitionsToEnd();
}, {
  scheduled: true,
  timezone: "America/Sao_Paulo"
});

console.log('\n📅 Cron agendado: A cada 1 minuto');
console.log('🌍 Timezone: America/Sao_Paulo (Horário de Brasília)');
console.log('\n💡 Para parar o cron, pressione Ctrl+C\n');
console.log('═══════════════════════════════════════════════════════\n');

// Capturar Ctrl+C para finalizar graciosamente
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Encerrando cron local...');
  task.stop();
  await prisma.$disconnect();
  console.log('✅ Cron encerrado. Até logo!\n');
  process.exit(0);
});
