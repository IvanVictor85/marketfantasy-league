const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('📦 Iniciando backup do banco de dados (via SQL direto)...\n');

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {}
    };

    // Usar queries SQL diretas para evitar conflito com schema

    // 1. Backup de Users
    console.log('👥 Exportando Users...');
    const users = await prisma.$queryRaw`SELECT * FROM users`;
    backup.data.users = users;
    console.log(`✅ ${users.length} usuários exportados`);

    // 2. Backup de Seasons
    console.log('🗓️  Exportando Seasons...');
    const seasons = await prisma.$queryRaw`SELECT * FROM seasons`;
    backup.data.seasons = seasons;
    console.log(`✅ ${seasons.length} temporadas exportadas`);

    // 3. Backup de Leagues
    console.log('🏆 Exportando Leagues...');
    const leagues = await prisma.$queryRaw`SELECT * FROM leagues`;
    backup.data.leagues = leagues;
    console.log(`✅ ${leagues.length} ligas exportadas`);

    // 4. Backup de LeagueEntries
    console.log('🎫 Exportando LeagueEntries...');
    const leagueEntries = await prisma.$queryRaw`SELECT * FROM league_entries`;
    backup.data.leagueEntries = leagueEntries;
    console.log(`✅ ${leagueEntries.length} entradas em ligas exportadas`);

    // 5. Backup de Competitions
    console.log('⚔️  Exportando Competitions...');
    const competitions = await prisma.$queryRaw`SELECT * FROM competitions`;
    backup.data.competitions = competitions;
    console.log(`✅ ${competitions.length} competições exportadas`);

    // 6. Backup de CompetitionTokens
    console.log('🪙 Exportando CompetitionTokens...');
    const competitionTokens = await prisma.$queryRaw`SELECT * FROM competition_tokens`;
    backup.data.competitionTokens = competitionTokens;
    console.log(`✅ ${competitionTokens.length} tokens de competição exportados`);

    // 7. Backup de UserTeams
    console.log('👥 Exportando UserTeams...');
    const userTeams = await prisma.$queryRaw`SELECT * FROM user_teams`;
    backup.data.userTeams = userTeams;
    console.log(`✅ ${userTeams.length} times de usuário exportados`);

    // 8. Backup de Tokens
    console.log('💰 Exportando Tokens...');
    const tokens = await prisma.$queryRaw`SELECT * FROM tokens`;
    backup.data.tokens = tokens;
    console.log(`✅ ${tokens.length} tokens exportados`);

    // 9. Backup de LeaguePlayer (relação liga-tokens)
    console.log('🔗 Exportando LeaguePlayers...');
    const leaguePlayers = await prisma.$queryRaw`SELECT * FROM league_players`;
    backup.data.leaguePlayers = leaguePlayers;
    console.log(`✅ ${leaguePlayers.length} relações liga-token exportadas`);

    // 10. Salvar arquivo
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // Converter BigInt para string antes de salvar JSON
    const replacer = (key, value) =>
      typeof value === 'bigint' ? value.toString() : value;

    fs.writeFileSync(filepath, JSON.stringify(backup, replacer, 2));

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
    console.log(`   - ${leaguePlayers.length} relações liga-token`);

    console.log('\n✅ Agora você pode resetar o banco com segurança!');
    console.log('   Digite "y" no prompt do Prisma para resetar.');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro ao fazer backup:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
