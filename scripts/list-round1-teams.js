const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.userTeam.findMany({
    where: { competitionId: 'cmibxrcl40001e30u5hdwtwsg' },
    include: {
      user: {
        select: { username: true, email: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log('\n✅ ========================================');
  console.log(`✅ RODADA 1: ${teams.length} TIMES CADASTRADOS`);
  console.log('✅ ========================================\n');

  teams.forEach((team, i) => {
    console.log(`${i + 1}. ${team.teamName}`);
    console.log(`   Jogador: ${team.user.username || team.user.email}`);
    console.log(`   Tokens: ${Array.isArray(team.players) ? team.players.join(', ') : JSON.stringify(team.players)}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
