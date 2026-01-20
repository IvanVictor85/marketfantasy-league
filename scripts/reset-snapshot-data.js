const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const competitionId = 'cmicalugq000210ou5ri809wa';

    console.log('🔧 Limpando dados do snapshot executado por engano...\n');

    // Limpar priceEnd de todos os tokens
    const tokensUpdated = await prisma.competitionToken.updateMany({
      where: { competitionId },
      data: {
        priceEnd: null
      }
    });

    console.log('✅ Limpou priceEnd de', tokensUpdated.count, 'tokens');

    // Resetar totalPoints de todos os times para 0 (será recalculado no snapshot final)
    const teamsUpdated = await prisma.userTeam.updateMany({
      where: { competitionId },
      data: {
        totalPoints: 0
      }
    });

    console.log('✅ Resetou totalPoints de', teamsUpdated.count, 'times para 0');

    console.log('\n✅ Pronto! Agora só os LIVE SCORES vão aparecer até o snapshot de amanhã às 21h!\n');

    // Verificar um time
    const team = await prisma.userTeam.findFirst({
      where: {
        competitionId,
        teamName: 'DeFi Champions'
      },
      select: {
        teamName: true,
        totalPoints: true
      }
    });

    console.log('🔍 Verificação:');
    console.log('   DeFi Champions - totalPoints:', team?.totalPoints || 'null (correto!)');
    console.log('\n   No ranking agora deve mostrar apenas LIVE SCORES! 🔴');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
