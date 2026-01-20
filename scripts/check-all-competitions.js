/**
 * Verifica pontuações de TODAS as competições
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 VERIFICANDO TODAS AS COMPETIÇÕES\n');

  const competitions = await prisma.competition.findMany({
    orderBy: { startDate: 'asc' },
    include: {
      league: { select: { name: true } },
      userTeams: {
        take: 3,
        orderBy: { totalPoints: 'desc' },
        include: {
          user: { select: { username: true, email: true } }
        }
      }
    }
  });

  for (const comp of competitions) {
    console.log('═'.repeat(80));
    console.log(`📌 ${comp.name || 'Competição'}`);
    console.log(`   ID: ${comp.id}`);
    console.log(`   Liga: ${comp.league.name}`);
    console.log(`   Status: ${comp.status}`);
    console.log(`   Times: ${comp.userTeams.length}`);
    console.log('');

    if (comp.userTeams.length > 0) {
      console.log('   🏆 TOP 3 TIMES:');
      comp.userTeams.forEach((team, i) => {
        const points = Number(team.totalPoints) || 0;
        console.log(`      ${i + 1}. ${team.teamName || 'Time sem nome'} - ${points.toFixed(2)} pts`);
      });
    } else {
      console.log('   ⚠️  Nenhum time cadastrado');
    }
    console.log('');
  }

  console.log('═'.repeat(80) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
