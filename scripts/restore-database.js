const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔄 Iniciando restauração do banco de dados...\n');

    // 1. Encontrar arquivo de backup mais recente
    const backupDir = path.join(__dirname, '..', 'backups');
    const backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));

    if (backupFiles.length === 0) {
      console.error('❌ Nenhum arquivo de backup encontrado!');
      process.exit(1);
    }

    // Pegar o mais recente
    const latestBackup = backupFiles.sort().reverse()[0];
    const backupPath = path.join(backupDir, latestBackup);

    console.log(`📂 Usando backup: ${latestBackup}\n`);

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    // 2. Restaurar Seasons
    console.log('🗓️  Restaurando Seasons...');
    for (const season of backup.data.seasons) {
      await prisma.season.create({
        data: {
          id: season.id,
          name: season.name,
          startDate: new Date(season.startDate),
          endDate: new Date(season.endDate),
          status: season.status,
          prizePool: parseFloat(season.prizePool || 0),
          createdAt: new Date(season.createdAt),
          updatedAt: new Date(season.updatedAt)
        }
      });
    }
    console.log(`✅ ${backup.data.seasons.length} temporadas restauradas`);

    // 3. Restaurar Leagues
    console.log('🏆 Restaurando Leagues...');
    for (const league of backup.data.leagues) {
      await prisma.league.create({
        data: {
          id: league.id,
          name: league.name,
          description: league.description,
          entryFee: parseFloat(league.entryFee || 0),
          emblemUrl: league.emblemUrl,
          badgeUrl: league.badgeUrl,
          bannerUrl: league.bannerUrl,
          createdAt: new Date(league.createdAt),
          updatedAt: new Date(league.updatedAt)
        }
      });
    }
    console.log(`✅ ${backup.data.leagues.length} ligas restauradas`);

    // 4. Restaurar Tokens
    console.log('💰 Restaurando Tokens...');
    for (const token of backup.data.tokens) {
      await prisma.token.create({
        data: {
          id: token.id,
          symbol: token.symbol,
          name: token.name,
          coingeckoId: token.coingeckoId,
          image: token.image,
          category: token.category,
          createdAt: new Date(token.createdAt),
          updatedAt: new Date(token.updatedAt)
        }
      });
    }
    console.log(`✅ ${backup.data.tokens.length} tokens restaurados`);

    // 5. Restaurar Users
    console.log('👥 Restaurando Users...');
    for (const user of backup.data.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          publicKey: user.publicKey,
          username: user.username,
          mainTeam: user.mainTeam,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }
    console.log(`✅ ${backup.data.users.length} usuários restaurados`);

    // 6. Restaurar Competitions
    console.log('⚔️  Restaurando Competitions...');
    for (const comp of backup.data.competitions) {
      await prisma.competition.create({
        data: {
          id: comp.id,
          name: comp.name,
          startDate: comp.startDate ? new Date(comp.startDate) : null,
          endDate: comp.endDate ? new Date(comp.endDate) : null,
          status: comp.status,
          prizePool: parseFloat(comp.prizePool || 0),
          distributed: comp.distributed || false,
          leagueId: comp.leagueId,
          seasonId: comp.seasonId,
          startTime: comp.startTime ? new Date(comp.startTime) : null,
          endTime: comp.endTime ? new Date(comp.endTime) : null,
          winners: comp.winners,
          createdAt: new Date(comp.createdAt),
          updatedAt: new Date(comp.updatedAt)
        }
      });
    }
    console.log(`✅ ${backup.data.competitions.length} competições restauradas`);

    // 7. Restaurar CompetitionTokens
    console.log('🪙 Restaurando CompetitionTokens...');
    for (const ct of backup.data.competitionTokens) {
      // Buscar dados do token
      const token = await prisma.token.findUnique({
        where: { id: ct.tokenId }
      });

      await prisma.competitionToken.create({
        data: {
          id: ct.id,
          competitionId: ct.competitionId,
          tokenId: ct.tokenId,
          symbol: ct.symbol,
          name: token?.name || ct.symbol, // ✅ Usar nome do token ou símbolo
          imageUrl: token?.logoUrl || '', // ✅ Usar imagem do token ou vazio
          marketCapRank: null, // Pode ser preenchido depois
          priceStart: ct.priceStart ? parseFloat(ct.priceStart) : null,
          priceEnd: ct.priceEnd ? parseFloat(ct.priceEnd) : null,
          percentChange: ct.percentageChange ? parseFloat(ct.percentageChange) : null,
          createdAt: new Date(ct.createdAt),
          updatedAt: new Date(ct.updatedAt)
        }
      });
    }
    console.log(`✅ ${backup.data.competitionTokens.length} tokens de competição restaurados`);

    // 8. Restaurar LeagueEntries
    console.log('🎫 Restaurando LeagueEntries...');
    for (const entry of backup.data.leagueEntries) {
      // Verificar se userId existe
      if (!entry.userId) continue;

      // Buscar userWallet se não existir no backup
      let userWallet = entry.userWallet;
      if (!userWallet) {
        const user = await prisma.user.findUnique({
          where: { id: entry.userId },
          select: { publicKey: true }
        });
        userWallet = user?.publicKey || 'UNKNOWN';
      }

      await prisma.leagueEntry.create({
        data: {
          id: entry.id,
          userId: entry.userId,
          leagueId: entry.leagueId,
          competitionId: entry.competitionId,
          userWallet: userWallet,
          amountPaid: entry.amountPaid ? parseFloat(entry.amountPaid) : 0,
          transactionHash: entry.transactionHash,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }
      });
    }
    console.log(`✅ ${backup.data.leagueEntries.length} entradas em ligas restauradas`);

    // 9. Restaurar UserTeams
    console.log('👥 Restaurando UserTeams...');
    for (const team of backup.data.userTeams) {
      await prisma.userTeam.create({
        data: {
          id: team.id,
          userId: team.userId,
          competitionId: team.competitionId,
          players: team.players,
          totalPoints: parseFloat(team.totalPoints || 0),
          teamName: team.teamName,
          selectedMascotUrl: team.selectedMascotUrl,
          // ✅ NOVOS CAMPOS: Valores padrão
          entryFeePaid: false, // Por padrão, considerar que ainda não pagou
          paymentTxHash: null,
          entryFeeAmount: 0,
          createdAt: new Date(team.createdAt),
          updatedAt: new Date(team.updatedAt)
        }
      });
    }
    console.log(`✅ ${backup.data.userTeams.length} times de usuário restaurados`);

    console.log('\n✅ Restauração concluída com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   - ${backup.data.seasons.length} temporadas`);
    console.log(`   - ${backup.data.leagues.length} ligas`);
    console.log(`   - ${backup.data.tokens.length} tokens`);
    console.log(`   - ${backup.data.users.length} usuários`);
    console.log(`   - ${backup.data.competitions.length} competições`);
    console.log(`   - ${backup.data.competitionTokens.length} tokens de competição`);
    console.log(`   - ${backup.data.leagueEntries.length} entradas em ligas`);
    console.log(`   - ${backup.data.userTeams.length} times de usuário`);

    console.log('\n🎯 Próximo passo: Acesse http://localhost:3001');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
