const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStatuses() {
  console.log('🔧 Corrigindo status das competições...\n');

  const now = new Date();
  console.log('Data/Hora atual:', now.toLocaleString('pt-BR'), '\n');

  // 1. Deletar LeagueEntry antiga sem competitionId
  console.log('1️⃣ Deletando LeagueEntry antiga sem competitionId...');
  const deleted = await prisma.leagueEntry.deleteMany({
    where: {
      competitionId: null,
      leagueId: 'cmh3qcrw80000cjvdrwtvt65i'
    }
  });
  console.log(`   ✅ ${deleted.count} registro(s) deletado(s)\n`);

  // 2. Buscar todas as competições
  const competitions = await prisma.competition.findMany({
    where: { leagueId: 'cmh3qcrw80000cjvdrwtvt65i' },
    orderBy: { startDate: 'asc' }
  });

  console.log('2️⃣ Atualizando status baseado em datas:\n');

  for (const comp of competitions) {
    let newStatus = comp.status;

    // Determinar status correto baseado nas datas
    if (now > comp.endDate) {
      newStatus = 'COMPLETED';
    } else if (now >= comp.startDate && now <= comp.endDate) {
      newStatus = 'ACTIVE';
    } else if (now < comp.startDate) {
      newStatus = 'PENDING';
    }

    if (newStatus !== comp.status) {
      await prisma.competition.update({
        where: { id: comp.id },
        data: { status: newStatus }
      });
      console.log(`   ✅ ${comp.name}: ${comp.status} → ${newStatus}`);
    } else {
      console.log(`   ⚪ ${comp.name}: ${comp.status} (sem mudança)`);
    }
  }

  console.log('\n✅ Correções concluídas!');
  await prisma.$disconnect();
}

fixStatuses().catch(console.error);
