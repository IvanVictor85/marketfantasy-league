const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPILogic() {
  const seasonId = 'cmicalu8a000010ouykcpw7b6';
  const userId = 'cmhslwje00001115muuomzd9c'; // From the error log

  console.log('🧪 Testing exact API logic that causes 500 error...\n');

  try {
    console.log('Step 1: Fetch season...');
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        competitions: {
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    });
    console.log('✅ Season fetched');

    console.log('\nStep 2: Calculate season data...');
    const completedCompetitions = season.competitions.filter(c => c.status === 'COMPLETED');
    const activeCompetition = season.competitions.find(c => c.status === 'ACTIVE');
    const totalRounds = season.competitions.length;
    const completedRounds = completedCompetitions.length;
    const totalPrizePool = Number(season.prizePool);
    console.log('✅ Season data calculated');

    console.log('\nStep 3: Fetch SeasonRanking...');
    const seasonRankings = await prisma.seasonRanking.findMany({
      where: { seasonId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            publicKey: true,
            name: true
          }
        }
      },
      orderBy: {
        totalSeasonPoints: 'desc'
      }
    });
    console.log(`✅ SeasonRanking fetched: ${seasonRankings.length} records`);

    console.log('\nStep 4: Fetch active round scores...');
    let activeRoundScores = new Map();
    if (activeCompetition) {
      const activeTeams = await prisma.userTeam.findMany({
        where: { competitionId: activeCompetition.id },
        select: {
          userId: true,
          totalPoints: true
        }
      });
      activeTeams.forEach(team => {
        activeRoundScores.set(team.userId, Number(team.totalPoints));
      });
      console.log(`✅ Active round scores fetched: ${activeTeams.length} teams`);
    }

    console.log('\nStep 5: Create rankings...');
    const rankings = seasonRankings.map((ranking, index) => {
      const completedPoints = Number(ranking.totalSeasonPoints);
      const activePoints = activeRoundScores.get(ranking.userId) || 0;
      const totalPoints = completedPoints + activePoints;

      let estimatedPrize = 0;
      if (index === 0) estimatedPrize = totalPrizePool * 0.5;
      else if (index === 1) estimatedPrize = totalPrizePool * 0.3;
      else if (index === 2) estimatedPrize = totalPrizePool * 0.2;

      return {
        rank: index + 1,
        userId: ranking.userId,
        username: ranking.user.username || ranking.user.email || 'Anônimo',
        publicKey: ranking.user.publicKey,
        name: ranking.user.name,
        completedPoints,
        activePoints,
        totalPoints,
        estimatedPrize: estimatedPrize > 0 ? estimatedPrize : null
      };
    });
    console.log('✅ Rankings created');

    console.log('\nStep 6: Re-sort and re-rank...');
    rankings.sort((a, b) => b.totalPoints - a.totalPoints);
    rankings.forEach((r, i) => {
      r.rank = i + 1;
      if (i === 0) r.estimatedPrize = totalPrizePool * 0.5;
      else if (i === 1) r.estimatedPrize = totalPrizePool * 0.3;
      else if (i === 2) r.estimatedPrize = totalPrizePool * 0.2;
      else r.estimatedPrize = null;
    });
    console.log('✅ Rankings re-sorted');

    console.log('\nStep 7: Fetch user breakdown (THIS IS WHERE IT MIGHT FAIL)...');
    if (userId) {
      console.log(`   Fetching for userId: ${userId}`);

      // This is the problematic query - nested orderBy
      const userTeams = await prisma.userTeam.findMany({
        where: {
          userId,
          competition: {
            seasonId
          }
        },
        include: {
          competition: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true
            }
          }
        },
        orderBy: {
          competition: {
            startDate: 'asc'
          }
        }
      });
      console.log(`✅ UserTeams fetched: ${userTeams.length} teams`);

      console.log('\nStep 8: Fetch prize claims...');
      const prizeClaims = await prisma.prizeClaim.findMany({
        where: {
          userId,
          seasonId  // ✅ FIXED: seasonId é campo direto
        }
        // ✅ FIXED: Removido include - PrizeClaim não tem relação com Competition
      });
      console.log(`✅ PrizeClaims fetched: ${prizeClaims.length} claims`);

      console.log('\nStep 9: Build userBreakdown...');
      const prizesByCompetition = new Map(
        prizeClaims.map(claim => [claim.competitionId, {
          amount: Number(claim.amount),
          position: claim.position,
          claimed: claim.claimed
        }])
      );

      let userBreakdown = userTeams.map(team => ({
        competitionId: team.competitionId,
        competitionName: team.competition.name || 'Sem nome',
        competitionStatus: team.competition.status,
        startDate: team.competition.startDate,
        endDate: team.competition.endDate,
        points: Number(team.totalPoints),
        prize: prizesByCompetition.get(team.competitionId) || null
      }));

      const accumulatedPrizes = prizeClaims.reduce((sum, claim) => sum + Number(claim.amount), 0);
      const userRanking = rankings.find(r => r.userId === userId);

      userBreakdown = {
        rounds: userBreakdown,
        totalCompletedPoints: userRanking?.completedPoints || 0,
        totalActivePoints: userRanking?.activePoints || 0,
        totalPoints: userRanking?.totalPoints || 0,
        currentRank: userRanking?.rank || null,
        estimatedPrize: userRanking?.estimatedPrize || null,
        accumulatedPrizes
      };

      console.log('✅ UserBreakdown built successfully');
      console.log('\n📊 User Breakdown:');
      console.log(JSON.stringify(userBreakdown, null, 2));
    }

    console.log('\n✅ ALL STEPS COMPLETED SUCCESSFULLY!');
    console.log('   → The API logic works correctly');
    console.log('   → The 500 error might be a runtime issue or caching problem');

  } catch (error) {
    console.error('\n❌ ERROR FOUND!');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAPILogic();
