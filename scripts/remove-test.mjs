import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function removeTestRound() {
  // Buscar rodadas de teste
  const testRounds = await prisma.competition.findMany({
    where: {
      OR: [
        { name: { contains: 'Teste' } },
        { name: { contains: 'teste' } },
        { name: { contains: 'Test' } },
      ]
    },
    include: { season: true }
  });

  console.log('Rodadas de teste encontradas:', testRounds.length);
  
  for (const r of testRounds) {
    console.log('  Deletando:', r.id, '-', r.name);
    await prisma.competition.delete({ where: { id: r.id } });
    console.log('  ✅ Deletado!');
  }

  // Também deletar seasons de teste
  const testSeasons = await prisma.season.findMany({
    where: {
      OR: [
        { name: { contains: 'Teste' } },
        { name: { contains: 'teste' } },
        { name: { contains: 'Test' } },
      ]
    }
  });

  console.log('\nSeasons de teste encontradas:', testSeasons.length);
  
  for (const s of testSeasons) {
    console.log('  Deletando:', s.id, '-', s.name);
    await prisma.season.delete({ where: { id: s.id } });
    console.log('  ✅ Deletado!');
  }

  console.log('\n🧹 Limpeza concluída!');
  await prisma.$disconnect();
}

removeTestRound();
