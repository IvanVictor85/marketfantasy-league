const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPrizes() {
  try {
    console.log('🔍 Verificando prêmios no banco de dados...\n');

    // Buscar todos os prêmios
    const prizes = await prisma.prizeClaim.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Total de prêmios encontrados: ${prizes.length}\n`);

    if (prizes.length === 0) {
      console.log('⚠️ Nenhum prêmio encontrado no banco de dados!');
      console.log('💡 Você precisa criar prêmios primeiro.\n');

      // Verificar competições completadas
      const completedCompetitions = await prisma.competition.findMany({
        where: { status: 'COMPLETED' },
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true
        },
        orderBy: { endDate: 'desc' },
        take: 5
      });

      console.log(`🏁 Competições completadas: ${completedCompetitions.length}`);
      completedCompetitions.forEach((comp, i) => {
        console.log(`  ${i + 1}. ${comp.name} (${comp.id})`);
        console.log(`     Status: ${comp.status}`);
        console.log(`     Fim: ${comp.endDate?.toLocaleString('pt-BR') || 'N/A'}\n`);
      });

      return;
    }

    // Agrupar por usuário
    const prizesByUser = prizes.reduce((acc, prize) => {
      const userId = prize.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: prize.user,
          prizes: [],
          totalAmount: 0,
          unclaimed: 0,
          claimed: 0
        };
      }
      acc[userId].prizes.push(prize);
      acc[userId].totalAmount += parseFloat(prize.amount.toString());
      if (prize.claimed) {
        acc[userId].claimed++;
      } else {
        acc[userId].unclaimed++;
      }
      return acc;
    }, {});

    // Exibir por usuário
    Object.values(prizesByUser).forEach(userPrizes => {
      console.log(`👤 Usuário: ${userPrizes.user.username || userPrizes.user.email || userPrizes.user.id}`);
      console.log(`   Total de prêmios: ${userPrizes.prizes.length}`);
      console.log(`   💰 Valor total: ${userPrizes.totalAmount.toFixed(4)} SOL`);
      console.log(`   ⏳ Não resgatados: ${userPrizes.unclaimed}`);
      console.log(`   ✅ Resgatados: ${userPrizes.claimed}\n`);

      userPrizes.prizes.forEach((prize, i) => {
        console.log(`   ${i + 1}. ${prize.claimed ? '✅' : '⏳'} ${prize.amount.toString()} SOL - Posição #${prize.position}`);
        console.log(`      ID: ${prize.id}`);
        console.log(`      Tipo: ${prize.prizeType}`);
        console.log(`      Competição: ${prize.competitionId || 'N/A'}`);
        console.log(`      Temporada: ${prize.seasonId || 'N/A'}`);
        console.log(`      Criado em: ${prize.createdAt.toLocaleString('pt-BR')}`);
        if (prize.claimed) {
          console.log(`      Resgatado em: ${prize.claimedAt?.toLocaleString('pt-BR')}`);
          console.log(`      TxHash: ${prize.txHash}`);
        }
        console.log('');
      });
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrizes();
