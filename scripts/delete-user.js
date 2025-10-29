const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUser(email) {
  try {
    console.log(`🔍 Procurando usuário com email: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        teams: true,
        leagueEntries: true,
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.id}`);
    console.log(`   - Times: ${user.teams.length}`);
    console.log(`   - Entradas na liga: ${user.leagueEntries.length}`);

    // Deletar times
    console.log('🗑️  Deletando times...');
    const deletedTeams = await prisma.team.deleteMany({
      where: { userId: user.id }
    });
    console.log(`✅ ${deletedTeams.count} time(s) deletado(s)`);

    // Deletar entradas na liga
    console.log('🗑️  Deletando entradas na liga...');
    const deletedEntries = await prisma.leagueEntry.deleteMany({
      where: { userId: user.id }
    });
    console.log(`✅ ${deletedEntries.count} entrada(s) deletada(s)`);

    // Deletar tokens de autenticação
    console.log('🗑️  Deletando tokens de autenticação...');
    const deletedTokens = await prisma.authToken.deleteMany({
      where: { userId: user.id }
    });
    console.log(`✅ ${deletedTokens.count} token(s) deletado(s)`);

    // Deletar usuário
    console.log('🗑️  Deletando usuário...');
    await prisma.user.delete({
      where: { id: user.id }
    });
    console.log(`✅ Usuário ${email} deletado com sucesso!`);

  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
const email = process.argv[2] || 'pretimao@gmail.com';
deleteUser(email);
