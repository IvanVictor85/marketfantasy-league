/**
 * 🚀 BOOST SPORT CLUB RECEBA
 *
 * Adiciona pontos extras ao time do Tokenizer para teste de premiação
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodada1Id = 'cmicalugq000210ou5ri809wa';

async function main() {
  console.log('\n🚀 BOOST PARA SPORT CLUB RECEBA (TESTE)\n');

  // Buscar time Sport Club Receba
  const receba = await prisma.userTeam.findFirst({
    where: {
      competitionId: rodada1Id,
      teamName: { contains: 'Receba' }
    },
    include: {
      user: { select: { username: true, email: true } }
    }
  });

  if (!receba) {
    console.log('❌ Time Sport Club Receba não encontrado');
    return;
  }

  console.log(`📊 Time encontrado: ${receba.teamName}`);
  console.log(`👤 Jogador: ${receba.user.username || receba.user.email}`);
  console.log(`📊 Pontuação atual: ${Number(receba.totalPoints).toFixed(2)} pts\n`);

  // Buscar maior pontuação atual
  const allTeams = await prisma.userTeam.findMany({
    where: { competitionId: rodada1Id },
    orderBy: { totalPoints: 'desc' },
    take: 1
  });

  const currentTopScore = allTeams.length > 0 ? Number(allTeams[0].totalPoints) : 0;
  console.log(`🏆 Maior pontuação atual: ${currentTopScore.toFixed(2)} pts\n`);

  // Definir nova pontuação (maior que o 1º + margem)
  const newScore = Math.max(60, currentTopScore + 10);

  console.log(`🎯 Nova pontuação para Sport Club Receba: ${newScore.toFixed(2)} pts\n`);

  // Atualizar pontuação
  const updated = await prisma.userTeam.update({
    where: { id: receba.id },
    data: { totalPoints: newScore }
  });

  console.log('✅ Pontuação atualizada!\n');
  console.log('═'.repeat(80));
  console.log(`🥇 SPORT CLUB RECEBA AGORA ESTÁ EM 1º LUGAR!`);
  console.log(`   Pontuação: ${newScore.toFixed(2)} pts`);
  console.log(`   Jogador: ${receba.user.username || receba.user.email}`);
  console.log('═'.repeat(80));
  console.log('\n💡 Agora você pode testar o claim da premiação!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
