const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('📦 Iniciando backup do banco de dados...\n');

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {}
    };

    // 1. Backup de Users
    console.log('👥 Exportando Users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        publicKey: true,
        username: true,
        mainTeam: true,
        createdAt: true
      }
    });
    backup.data.users = users;
    console.log(`✅ ${users.length} usuários exportados`);

    // 2. Backup de Seasons
    console.log('🗓️  Exportando Seasons...');
    const seasons = await prisma.season.findMany();
    backup.data.seasons = seasons;
    console.log(`✅ ${seasons.length} temporadas exportadas`);

    // 3. Backup de Leagues
    console.log('🏆 Exportando Leagues...');
    const leagues = await prisma.league.findMany({
      include: {
        allowedPlayers: {
          include: {
            token: true
          }
        }
      }
    });
    backup.data.leagues = leagues;
    console.log(`✅ ${leagues.length} ligas exportadas`);

    // 4. Backup de LeagueEntries
    console.log('🎫 Exportando LeagueEntries...');
    const leagueEntries = await prisma.leagueEntry.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
    backup.data.leagueEntries = leagueEntries;
    console.log(`✅ ${leagueEntries.length} entradas em ligas exportadas`);

    // 5. Backup de Competitions
    console.log('⚔️  Exportando Competitions...');
    const competitions = await prisma.competition.findMany({
      include: {
        league: {
          select: {
            name: true
          }
        }
      }
    });
    backup.data.competitions = competitions;
    console.log(`✅ ${competitions.length} competições exportadas`);

    // 6. Backup de CompetitionTokens
    console.log('🪙 Exportando CompetitionTokens...');
    const competitionTokens = await prisma.competitionToken.findMany({
      include: {
        competition: {
          select: {
            name: true
          }
        }
      }
    });
    backup.data.competitionTokens = competitionTokens;
    console.log(`✅ ${competitionTokens.length} tokens de competição exportados`);

    // 7. Backup de UserTeams
    console.log('👥 Exportando UserTeams...');
    const userTeams = await prisma.userTeam.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        competition: {
          select: {
            name: true
          }
        }
      }
    });
    backup.data.userTeams = userTeams;
    console.log(`✅ ${userTeams.length} times de usuário exportados`);

    // 8. Backup de Tokens
    console.log('💰 Exportando Tokens...');
    const tokens = await prisma.token.findMany();
    backup.data.tokens = tokens;
    console.log(`✅ ${tokens.length} tokens exportados`);

    // 9. Salvar arquivo
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    console.log('\n✅ Backup concluído com sucesso!');
    console.log(`📁 Arquivo salvo em: ${filepath}`);
    console.log('\n📊 Resumo do Backup:');
    console.log(`   - ${users.length} usuários`);
    console.log(`   - ${seasons.length} temporadas`);
    console.log(`   - ${leagues.length} ligas`);
    console.log(`   - ${leagueEntries.length} entradas em ligas`);
    console.log(`   - ${competitions.length} competições`);
    console.log(`   - ${competitionTokens.length} tokens de competição`);
    console.log(`   - ${userTeams.length} times de usuário`);
    console.log(`   - ${tokens.length} tokens`);

    console.log('\n✅ Agora você pode resetar o banco com segurança!');
    console.log('   Digite "y" no prompt do Prisma para resetar.');
    console.log('\n   Depois rode: node scripts/restore-database.js');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro ao fazer backup:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
