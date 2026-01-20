/**
 * 🏷️ RENOMEIA COMPETIÇÕES
 *
 * Clarifica os nomes das competições para evitar confusão:
 * - Rodada Teste (COMPLETED)
 * - Rodada 1 (ACTIVE)
 * - Rodada 2 (PENDING)
 * - Rodada 3 (PENDING)
 * - Rodada 4 (PENDING)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🏷️ RENOMEANDO COMPETIÇÕES\n');

  // Buscar todas as competições
  const competitions = await prisma.competition.findMany({
    orderBy: { startDate: 'asc' },
    include: {
      league: { select: { name: true } },
      _count: { select: { userTeams: true } }
    }
  });

  console.log(`📊 Encontradas ${competitions.length} competições\n`);
  console.log('═'.repeat(80));

  // Mostrar estado atual
  console.log('\n📋 ESTADO ATUAL:\n');
  competitions.forEach((comp, i) => {
    console.log(`${i + 1}. ${comp.name || 'Sem nome'}`);
    console.log(`   ID: ${comp.id}`);
    console.log(`   Status: ${comp.status}`);
    console.log(`   Times: ${comp._count.userTeams}`);
    console.log('');
  });

  console.log('═'.repeat(80));
  console.log('\n🔄 APLICANDO NOVOS NOMES:\n');

  // Mapear IDs para novos nomes
  const renameMap = {
    'cmibxrcl40001e30u5hdwtwsg': 'Rodada Teste',
    'cmicalugq000210ou5ri809wa': 'Rodada 1',
    'cmicaluov000410ouj4ywkwop': 'Rodada 2',
    'cmicalusz000610ousgsnhr2z': 'Rodada 3',
    'cmicalux3000810oueqd2dkax': 'Rodada 4'
  };

  let renamed = 0;
  let notFound = 0;

  for (const comp of competitions) {
    const newName = renameMap[comp.id];

    if (newName) {
      await prisma.competition.update({
        where: { id: comp.id },
        data: { name: newName }
      });

      console.log(`✅ ${comp.name || 'Sem nome'} → ${newName}`);
      console.log(`   Status: ${comp.status}, Times: ${comp._count.userTeams}`);
      console.log('');
      renamed++;
    } else {
      console.log(`⚠️  Competição não mapeada: ${comp.id}`);
      notFound++;
    }
  }

  console.log('═'.repeat(80));
  console.log(`\n📊 RESULTADO:`);
  console.log(`   Renomeadas: ${renamed}`);
  console.log(`   Não encontradas: ${notFound}`);

  // Mostrar estado final
  console.log('\n📋 ESTADO FINAL:\n');
  const updated = await prisma.competition.findMany({
    orderBy: { startDate: 'asc' },
    include: {
      league: { select: { name: true } },
      _count: { select: { userTeams: true } }
    }
  });

  updated.forEach((comp, i) => {
    const icon = comp.status === 'COMPLETED' ? '✅' :
                 comp.status === 'ACTIVE' ? '▶️' : '⏸️';
    console.log(`${icon} ${comp.name}`);
    console.log(`   Status: ${comp.status}, Times: ${comp._count.userTeams}`);
    console.log('');
  });

  console.log('✅ Renomeação concluída!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
