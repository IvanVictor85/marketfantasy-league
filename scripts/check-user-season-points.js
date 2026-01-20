const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserSeasonPoints() {
  try {
    console.log('📊 Verificando pontuação da temporada do usuário...\n');

    // Buscar o usuário Sport Club Receba
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'Sport Club Receba' } },
          { email: 'pretimaoairdrops@gmail.com' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('👤 Usuário:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🆔 ID:', user.id, '\n');

    // Buscar a temporada
    const season = await prisma.season.findFirst({
      where: {
        name: { contains: 'Temporada 1' }
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    });

    if (!season) {
      console.log('❌ Temporada não encontrada');
      return;
    }

    console.log('🏆 Temporada:', season.name);
    console.log('📊 Status:', season.status, '\n');

    // Buscar todas as competições da temporada
    const competitions = await prisma.competition.findMany({
      where: {
        seasonId: season.id
      },
      orderBy: {
        startDate: 'asc'
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true
      }
    });

    console.log(`📋 Competições da temporada: ${competitions.length}\n`);

    // Buscar os times do usuário em cada competição
    let totalPoints = 0;
    let detailedPoints = [];

    for (const comp of competitions) {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          userId: user.id,
          competitionId: comp.id
        },
        select: {
          id: true,
          teamName: true,
          totalPoints: true,
          players: true
        }
      });

      if (userTeam) {
        const points = Number(userTeam.totalPoints) || 0;
        totalPoints += points;

        const statusEmoji = comp.status === 'COMPLETED' ? '✅' : comp.status === 'ACTIVE' ? '▶️' : '⏸️';

        console.log(`${statusEmoji} ${comp.name || 'Sem nome'}`);
        console.log(`   Status: ${comp.status}`);
        console.log(`   Time: ${userTeam.teamName}`);
        console.log(`   Pontos: ${points.toFixed(2)}`);
        console.log(`   Players: ${JSON.stringify(userTeam.players)}`);
        console.log('');

        detailedPoints.push({
          competition: comp.name,
          status: comp.status,
          points
        });
      } else {
        console.log(`⚠️ ${comp.name || 'Sem nome'} - Sem time cadastrado\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RESUMO DA PONTUAÇÃO');
    console.log('═══════════════════════════════════════════════════════\n');

    detailedPoints.forEach((item, index) => {
      console.log(`${index + 1}. ${item.competition}: ${item.points.toFixed(2)} pts (${item.status})`);
    });

    console.log('\n───────────────────────────────────────────────────────');
    console.log(`🏆 TOTAL ACUMULADO: ${totalPoints.toFixed(2)} pontos`);
    console.log('───────────────────────────────────────────────────────\n');

    // Buscar SeasonRanking
    const seasonRanking = await prisma.seasonRanking.findFirst({
      where: {
        userId: user.id,
        seasonId: season.id
      },
      select: {
        totalSeasonPoints: true
      }
    });

    if (seasonRanking) {
      const dbPoints = Number(seasonRanking.totalSeasonPoints);
      console.log(`📊 SeasonRanking no banco: ${dbPoints.toFixed(2)} pontos`);

      if (Math.abs(dbPoints - totalPoints) > 0.01) {
        console.log(`⚠️ DIVERGÊNCIA DETECTADA!`);
        console.log(`   Esperado (soma das rodadas): ${totalPoints.toFixed(2)}`);
        console.log(`   No banco (SeasonRanking): ${dbPoints.toFixed(2)}`);
        console.log(`   Diferença: ${(totalPoints - dbPoints).toFixed(2)}`);
      } else {
        console.log(`✅ Pontuações batem! Sistema está correto.`);
      }
    } else {
      console.log('⚠️ Nenhum SeasonRanking encontrado para este usuário');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSeasonPoints();
