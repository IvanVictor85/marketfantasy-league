const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function backupCriticalData() {
  console.log('💾 Iniciando backup de dados críticos...\n');

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    // Garantir que pasta existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Buscar dados críticos
    console.log('📊 Buscando dados...');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        publicKey: true,
        name: true,
        username: true,
        mainTeam: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const teams = await prisma.team.findMany();

    const leagues = await prisma.league.findMany();

    const competitions = await prisma.competition.findMany({
      include: {
        competitionTokens: true
      }
    });

    const leagueEntries = await prisma.leagueEntry.findMany();

    const userTeams = await prisma.userTeam.findMany();

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        users: users,
        teams_legacy: teams,
        leagues: leagues,
        competitions: competitions,
        leagueEntries: leagueEntries,
        userTeams: userTeams
      },
      stats: {
        users: users.length,
        teams_legacy: teams.length,
        leagues: leagues.length,
        competitions: competitions.length,
        leagueEntries: leagueEntries.length,
        userTeams: userTeams.length
      }
    };

    // Salvar backup
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log('\n✅ Backup concluído com sucesso!');
    console.log(`📁 Arquivo: ${backupFile}`);
    console.log('\n📊 Estatísticas:');
    console.log(`   Usuários: ${users.length}`);
    console.log(`   Times (legacy): ${teams.length}`);
    console.log(`   Ligas: ${leagues.length}`);
    console.log(`   Competições: ${competitions.length}`);
    console.log(`   Entradas: ${leagueEntries.length}`);
    console.log(`   UserTeams (atual): ${userTeams.length}`);

    await prisma.$disconnect();
    return backupFile;

  } catch (error) {
    console.error('❌ Erro no backup:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

backupCriticalData();
