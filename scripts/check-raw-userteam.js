const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRawUserTeam() {
  try {
    console.log('🔍 Verificando dados brutos da UserTeam...\n');

    const userId = 'cmhslwje00001115muuomzd9c';

    // Buscar dados brutos com Prisma.$queryRaw para ver tudo
    const userTeams = await prisma.$queryRaw`
      SELECT * FROM user_teams WHERE "userId" = ${userId}::text ORDER BY "createdAt" ASC
    `;

    console.log(`📊 Total de registros: ${userTeams.length}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    userTeams.forEach((ut, index) => {
      console.log(`${index + 1}. Competition ID: ${ut.competitionId}`);
      console.log(`   Campos disponíveis no registro:`);
      console.log(JSON.stringify(ut, null, 2));
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkRawUserTeam();
