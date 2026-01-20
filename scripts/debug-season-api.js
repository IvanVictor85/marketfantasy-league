const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSeasonAPI() {
  console.log('🔍 Debugging Season API...\n');

  try {
    // 1. Check if Season exists
    console.log('1️⃣ Checking Seasons:');
    const seasons = await prisma.season.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        prizePool: true
      }
    });

    if (seasons.length === 0) {
      console.log('   ❌ NO SEASONS FOUND IN DATABASE!');
      console.log('   → This is likely the cause of the 500 error');
      return;
    }

    seasons.forEach(s => {
      console.log(`   ✅ ${s.name} (${s.id})`);
      console.log(`      Status: ${s.status}, Prize: ${s.prizePool} SOL`);
    });

    const seasonId = seasons[0].id;
    console.log(`\n   Using seasonId: ${seasonId}`);

    // 2. Check if competitions have seasonId
    console.log('\n2️⃣ Checking Competitions linked to Season:');
    const competitions = await prisma.competition.findMany({
      where: { seasonId },
      select: {
        id: true,
        name: true,
        status: true,
        seasonId: true
      },
      orderBy: { startDate: 'desc' },
      take: 5
    });

    if (competitions.length === 0) {
      console.log('   ❌ NO COMPETITIONS LINKED TO SEASON!');
      console.log('   → Competitions need to have seasonId set');
    } else {
      competitions.forEach(c => {
        console.log(`   ✅ ${c.name} (${c.status})`);
      });
    }

    // 3. Check if SeasonRanking exists
    console.log('\n3️⃣ Checking SeasonRanking records:');
    const rankings = await prisma.seasonRanking.findMany({
      where: { seasonId },
      take: 5,
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    if (rankings.length === 0) {
      console.log('   ⚠️  NO SEASONRANKING RECORDS FOUND');
      console.log('   → This is OK if no rounds have been completed yet');
      console.log('   → SeasonRanking is created when a round ends');
    } else {
      rankings.forEach(r => {
        const username = r.user.username || r.user.email;
        console.log(`   ✅ ${username}: ${r.totalSeasonPoints} pts`);
      });
    }

    // 4. Test the API logic manually
    console.log('\n4️⃣ Testing API logic:');

    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        competitions: {
          orderBy: { startDate: 'asc' }
        }
      }
    });

    if (!season) {
      console.log('   ❌ Season not found!');
      return;
    }

    console.log(`   ✅ Season found: ${season.name}`);
    console.log(`   Competitions: ${season.competitions.length}`);

    const completedCompetitions = season.competitions.filter(c => c.status === 'COMPLETED');
    const activeCompetition = season.competitions.find(c => c.status === 'ACTIVE');

    console.log(`   Completed rounds: ${completedCompetitions.length}`);
    console.log(`   Active round: ${activeCompetition ? activeCompetition.name : 'None'}`);

    // 5. Check if there are UserTeams for active competition
    if (activeCompetition) {
      console.log('\n5️⃣ Checking UserTeams for active competition:');
      const userTeams = await prisma.userTeam.findMany({
        where: { competitionId: activeCompetition.id },
        take: 3,
        select: {
          userId: true,
          totalPoints: true,
          user: {
            select: {
              username: true,
              email: true
            }
          }
        }
      });

      if (userTeams.length === 0) {
        console.log('   ⚠️  No UserTeams found for active competition');
      } else {
        userTeams.forEach(t => {
          const username = t.user.username || t.user.email;
          console.log(`   ✅ ${username}: ${t.totalPoints} pts (parcial)`);
        });
      }
    }

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('❌ Error during debug:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugSeasonAPI();
