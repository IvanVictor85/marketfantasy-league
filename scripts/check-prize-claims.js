/**
 * 🏆 VERIFICAR PRIZE CLAIMS DAS RODADAS
 *
 * Verifica se os prêmios foram registrados para cada rodada
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rounds = [
  { id: 'cmicalugq000210ou5ri809wa', name: 'Rodada 1' },
  { id: 'cmicaluov000410ouj4ywkwop', name: 'Rodada 2' },
  { id: 'cmicalusz000610ousgsnhr2z', name: 'Rodada 3' },
  { id: 'cmicalux3000810oueqd2dkax', name: 'Rodada 4' }
];

async function checkPrizeClaims() {
  console.log('\n🏆 VERIFICANDO PRIZE CLAIMS DAS RODADAS\n');
  console.log('='.repeat(80));

  try {
    for (const round of rounds) {
      console.log(`\n📋 ${round.name} (${round.id}):\n`);

      // Buscar competição
      const competition = await prisma.competition.findUnique({
        where: { id: round.id },
        select: {
          status: true,
          prizePool: true
        }
      });

      console.log(`   Status: ${competition.status}`);
      console.log(`   Prize Pool: ${Number(competition.prizePool)} SOL`);

      // Buscar PrizeClaims
      const prizeClaims = await prisma.prizeClaim.findMany({
        where: { competitionId: round.id },
        include: {
          user: {
            select: {
              username: true,
              email: true
            }
          }
        },
        orderBy: {
          position: 'asc'
        }
      });

      console.log(`   Prize Claims: ${prizeClaims.length}\n`);

      if (prizeClaims.length > 0) {
        prizeClaims.forEach(claim => {
          const user = claim.user.username || claim.user.email;
          const medal = claim.position === 1 ? '🥇' : claim.position === 2 ? '🥈' : claim.position === 3 ? '🥉' : '🏅';
          console.log(`   ${medal} ${claim.position}º - ${user}: ${Number(claim.amount)} SOL (${claim.status})`);
        });
      } else {
        console.log('   ❌ NENHUM PRIZE CLAIM ENCONTRADO!');
      }

      console.log('');
    }

    // Resumo
    console.log('='.repeat(80));
    console.log('\n📊 RESUMO:\n');

    const allClaims = await prisma.prizeClaim.findMany({
      select: {
        competitionId: true,
        amount: true
      }
    });

    const claimsByRound = rounds.map(round => ({
      name: round.name,
      count: allClaims.filter(c => c.competitionId === round.id).length
    }));

    claimsByRound.forEach(r => {
      const status = r.count > 0 ? '✅' : '❌';
      console.log(`   ${status} ${r.name}: ${r.count} prize claims`);
    });

    const missingClaims = claimsByRound.filter(r => r.count === 0);

    if (missingClaims.length > 0) {
      console.log(`\n⚠️  ${missingClaims.length} rodadas SEM prize claims!`);
      console.log('   É necessário criar os prize claims para essas rodadas.\n');
    } else {
      console.log('\n✅ Todas as rodadas têm prize claims!\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('='.repeat(80));
  console.log('\n✅ Verificação concluída!\n');
}

checkPrizeClaims();
