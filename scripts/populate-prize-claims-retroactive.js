/**
 * 💰 POPULAR PRIZE CLAIMS RETROATIVAMENTE
 *
 * Cria os PrizeClaims para as Rodadas 2 e 3 que já foram finalizadas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rounds = [
  { id: 'cmicaluov000410ouj4ywkwop', name: 'Rodada 2' },
  { id: 'cmicalusz000610ousgsnhr2z', name: 'Rodada 3' }
];

async function populatePrizeClaims() {
  console.log('\n💰 POPULANDO PRIZE CLAIMS RETROATIVAMENTE\n');
  console.log('='.repeat(80));

  try {
    for (const round of rounds) {
      console.log(`\n📋 ${round.name} (${round.id}):\n`);

      // Buscar competição
      const competition = await prisma.competition.findUnique({
        where: { id: round.id },
        include: {
          league: true
        }
      });

      if (!competition) {
        console.log('❌ Competição não encontrada');
        continue;
      }

      console.log(`   Status: ${competition.status}`);
      console.log(`   Prize Pool: ${Number(competition.prizePool)} SOL`);

      // Verificar se já tem PrizeClaims
      const existing = await prisma.prizeClaim.count({
        where: { competitionId: round.id }
      });

      if (existing > 0) {
        console.log(`   ⚠️  Já existem ${existing} PrizeClaims - pulando`);
        continue;
      }

      // Buscar Top 3 times
      const topTeams = await prisma.userTeam.findMany({
        where: { competitionId: round.id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: {
          totalPoints: 'desc'
        },
        take: 3
      });

      console.log(`   Top 3 times encontrados: ${topTeams.length}\n`);

      // Prize distribution (50%, 30%, 20%)
      const prizeDistribution = [0.5, 0.3, 0.2];
      const totalPrize = Number(competition.prizePool);

      // Criar PrizeClaims
      for (let i = 0; i < topTeams.length; i++) {
        const team = topTeams[i];
        const position = i + 1;
        const amount = totalPrize * prizeDistribution[i];

        await prisma.prizeClaim.create({
          data: {
            userId: team.userId,
            competitionId: round.id,
            amount: amount,
            position: position,
            prizeType: 'ROUND_PRIZE',
            claimed: false
          }
        });

        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉';
        const user = team.user.username || team.user.email;

        console.log(`   ${medal} ${position}º - ${user} (${team.teamName}): ${amount.toFixed(4)} SOL`);
      }

      console.log(`\n   ✅ ${topTeams.length} PrizeClaims criados\n`);
    }

    // Verificação final
    console.log('='.repeat(80));
    console.log('\n📊 VERIFICAÇÃO FINAL:\n');

    for (const round of rounds) {
      const count = await prisma.prizeClaim.count({
        where: { competitionId: round.id }
      });

      const status = count > 0 ? '✅' : '❌';
      console.log(`   ${status} ${round.name}: ${count} PrizeClaims`);
    }

    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('='.repeat(80));
  console.log('\n✅ População concluída!\n');
}

populatePrizeClaims();
