const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.userTeam.findMany({
    where: { competitionId: 'cmicalugq000210ou5ri809wa' },
    include: {
      user: { select: { username: true, email: true } }
    },
    orderBy: { totalPoints: 'desc' }
  });

  console.log('\n📊 TODOS OS TIMES DA RODADA 1:\n');

  teams.forEach((team, i) => {
    console.log(`${i + 1}. ${team.teamName}`);
    console.log(`   User: ${team.user.username || team.user.email}`);
    console.log(`   Points: ${Number(team.totalPoints).toFixed(2)}%\n`);
  });

  console.log(`Total: ${teams.length} times\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
