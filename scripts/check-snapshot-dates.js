const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n📅 VERIFICANDO DATAS DOS SNAPSHOTS\n');

  // Rodada Teste
  const rodadaTeste = await prisma.competition.findUnique({
    where: { id: 'cmibxrcl40001e30u5hdwtwsg' },
    include: {
      competitionTokens: {
        where: {
          OR: [
            { priceStartDate: { not: null } },
            { priceEndDate: { not: null } }
          ]
        },
        take: 1
      }
    }
  });

  // Rodada 1
  const rodada1 = await prisma.competition.findUnique({
    where: { id: 'cmicalugq000210ou5ri809wa' },
    include: {
      competitionTokens: {
        where: {
          OR: [
            { priceStartDate: { not: null } },
            { priceEndDate: { not: null } }
          ]
        },
        take: 1
      }
    }
  });

  console.log('═'.repeat(80));
  console.log('📊 RODADA TESTE (COMPLETED)');
  console.log('═'.repeat(80));
  if (rodadaTeste) {
    console.log(`Status: ${rodadaTeste.status}`);
    console.log(`Start Date: ${rodadaTeste.startDate}`);
    console.log(`End Date: ${rodadaTeste.endDate}`);

    if (rodadaTeste.competitionTokens[0]) {
      const ct = rodadaTeste.competitionTokens[0];
      console.log(`\nSnapshot Inicial: ${ct.priceStartDate || 'NÃO REGISTRADO'}`);
      console.log(`Snapshot Final: ${ct.priceEndDate || 'NÃO REGISTRADO'}`);

      if (ct.priceStartDate && ct.priceEndDate) {
        const duration = new Date(ct.priceEndDate) - new Date(ct.priceStartDate);
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        console.log(`\nDuração: ${days} dias e ${hours % 24} horas`);
      }
    } else {
      console.log('\n⚠️  Nenhum snapshot encontrado');
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('📊 RODADA 1 (ACTIVE)');
  console.log('═'.repeat(80));
  if (rodada1) {
    console.log(`Status: ${rodada1.status}`);
    console.log(`Start Date: ${rodada1.startDate}`);
    console.log(`End Date: ${rodada1.endDate}`);

    if (rodada1.competitionTokens[0]) {
      const ct = rodada1.competitionTokens[0];
      console.log(`\nSnapshot Inicial: ${ct.priceStartDate || 'NÃO REGISTRADO'}`);
      console.log(`Snapshot Final: ${ct.priceEndDate || 'NÃO REGISTRADO'}`);

      if (ct.priceStartDate) {
        const elapsed = new Date() - new Date(ct.priceStartDate);
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        console.log(`\nTempo desde snapshot: ${days} dias e ${hours % 24} horas`);
      }
    } else {
      console.log('\n⚠️  Nenhum snapshot encontrado');
    }
  }

  console.log('\n' + '═'.repeat(80) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
