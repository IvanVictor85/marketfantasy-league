/**
 * 📋 Lista IDs das competições para uso com manual-snapshot.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n📋 RODADAS DISPONÍVEIS PARA SNAPSHOT MANUAL\n');

  const competitions = await prisma.competition.findMany({
    orderBy: { startDate: 'asc' },
    include: {
      league: { select: { name: true } },
      _count: { select: { userTeams: true } }
    }
  });

  competitions.forEach((c, i) => {
    const statusIcon = c.status === 'COMPLETED' ? '✅' : c.status === 'ACTIVE' ? '🔵' : '⏳';

    console.log(`${statusIcon} Rodada ${i + 1}: ${c.name || 'N/A'}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   Status: ${c.status}`);
    console.log(`   Times: ${c._count.userTeams}`);
    console.log(`   Período: ${c.startDate.toLocaleDateString('pt-BR')} até ${c.endDate.toLocaleDateString('pt-BR')}`);

    // Sugestão de comando
    if (c.status === 'PENDING') {
      console.log(`   💡 Snapshot inicial: node scripts/manual-snapshot.js ${c.id} start`);
    } else if (c.status === 'ACTIVE') {
      console.log(`   💡 Snapshot final: node scripts/manual-snapshot.js ${c.id} end`);
    }

    console.log('');
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 COMO USAR:');
  console.log('   1. Copie o ID da rodada desejada');
  console.log('   2. Execute: node scripts/manual-snapshot.js <ID> <tipo>');
  console.log('   3. Tipos: start (inicial) ou end (final)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
