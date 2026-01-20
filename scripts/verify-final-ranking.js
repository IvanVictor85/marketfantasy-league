const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.userTeam.findMany({
    where: { competitionId: 'cmicalugq000210ou5ri809wa' },
    include: { user: { select: { username: true, email: true } } },
    orderBy: { totalPoints: 'desc' },
    take: 10
  });

  console.log('\n🏆 TOP 10 FINAL DA RODADA 1 (COMPLETED):\n');

  teams.forEach((t, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
    const position = (i + 1).toString().padStart(2, ' ');
    const name = t.teamName.padEnd(25, ' ');
    const score = Number(t.totalPoints).toFixed(2).padStart(8, ' ');
    const user = t.user.username || t.user.email;

    console.log(`${medal} ${position}º - ${name} - ${score} pts (${user})`);
  });

  // Verificar status da competição
  const competition = await prisma.competition.findUnique({
    where: { id: 'cmicalugq000210ou5ri809wa' }
  });

  console.log('\n📊 STATUS DA RODADA 1:');
  console.log(`   Nome: ${competition.name}`);
  console.log(`   Status: ${competition.status}`);
  console.log(`   Prize Pool: ${Number(competition.prizePool)} SOL`);
  console.log('');

  await prisma.$disconnect();
}

main();
