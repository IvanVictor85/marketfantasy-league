const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Atualiza o status da temporada baseado no status das rodadas
 */
async function fixSeasonStatus() {
  try {
    console.log('🔧 Corrigindo status das temporadas...\n');

    const seasons = await prisma.season.findMany({
      include: {
        competitions: {
          select: {
            status: true
          }
        }
      }
    });

    for (const season of seasons) {
      const hasActive = season.competitions.some(c => c.status === 'ACTIVE');
      const hasPending = season.competitions.some(c => c.status === 'PENDING');
      const allCompleted = season.competitions.every(c => c.status === 'COMPLETED');

      let correctStatus = 'PENDING';

      if (allCompleted) {
        correctStatus = 'COMPLETED';
      } else if (hasActive || hasPending) {
        correctStatus = 'ACTIVE';
      }

      console.log(`📊 ${season.name}:`);
      console.log(`   Status atual: ${season.status}`);
      console.log(`   Status correto: ${correctStatus}`);

      if (season.status !== correctStatus) {
        console.log(`   ✅ Atualizando para ${correctStatus}...`);

        await prisma.season.update({
          where: { id: season.id },
          data: { status: correctStatus }
        });

        console.log(`   ✅ Atualizado com sucesso!\n`);
      } else {
        console.log(`   ℹ️  Já está correto\n`);
      }
    }

    console.log('✅ Correção concluída!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSeasonStatus();
