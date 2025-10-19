import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateMainLeague() {
  console.log('🔄 Atualizando Liga Principal...');

  try {
    const mainLeague = await prisma.league.findFirst({
      where: { leagueType: 'MAIN' }
    });

    if (!mainLeague) {
      console.error('❌ Liga Principal não encontrada');
      return;
    }

    console.log('📊 Estado atual:');
    console.log('   ID:', mainLeague.id);
    console.log('   Início:', mainLeague.startDate);
    console.log('   Fim:', mainLeague.endDate);
    console.log('   Ativa:', mainLeague.isActive);

    const updated = await prisma.league.update({
      where: { id: mainLeague.id },
      data: {
        startDate: new Date('2025-10-20T02:00:00Z'), // 19/10 23h Brasil (UTC-3)
        endDate: new Date('2025-10-21T02:00:00Z'),   // 20/10 23h Brasil (UTC-3)
        isActive: true
      }
    });

    console.log('\n✅ Liga Principal atualizada com sucesso!');
    console.log('   ID:', updated.id);
    console.log('   Início:', updated.startDate.toISOString(), '(19/10 23h Brasil)');
    console.log('   Fim:', updated.endDate.toISOString(), '(20/10 23h Brasil)');
    console.log('   Ativa:', updated.isActive);
    console.log('   Duração:', '24 horas');
  } catch (error) {
    console.error('❌ Erro ao atualizar liga:', error);
    throw error;
  }
}

updateMainLeague()
  .then(() => {
    console.log('\n✅ Atualização concluída!');
    return prisma.$disconnect();
  })
  .catch(err => {
    console.error('\n❌ Erro fatal:', err);
    return prisma.$disconnect().then(() => process.exit(1));
  });
