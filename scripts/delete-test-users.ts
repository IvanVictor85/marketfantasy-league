import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUsers() {
  try {
    console.log('🗑️ Iniciando deleção de usuários...\n');

    const user1 = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: '3GLFWDvT' } },
          { email: { contains: '3GLFWDvT' } }
        ]
      }
    });

    const user2 = await prisma.user.findFirst({
      where: {
        OR: [
          { name: 'pretimao' },
          { email: { contains: 'pretimao' } }
        ]
      }
    });

    if (user1) {
      console.log('📋 Deletando usuário:', user1.name, '-', user1.email);
      await prisma.authToken.deleteMany({ where: { userId: user1.id } });
      await prisma.verificationCode.deleteMany({ where: { email: user1.email } });
      await prisma.team.deleteMany({ where: { userId: user1.id } });
      await prisma.leagueEntry.deleteMany({ where: { userId: user1.id } });
      await prisma.user.delete({ where: { id: user1.id } });
      console.log('✅ Usuário deletado!\n');
    } else {
      console.log('⚠️ Usuário 3GLFWDvT não encontrado\n');
    }

    if (user2) {
      console.log('📋 Deletando usuário:', user2.name, '-', user2.email);
      await prisma.authToken.deleteMany({ where: { userId: user2.id } });
      await prisma.verificationCode.deleteMany({ where: { email: user2.email } });
      await prisma.team.deleteMany({ where: { userId: user2.id } });
      await prisma.leagueEntry.deleteMany({ where: { userId: user2.id } });
      await prisma.user.delete({ where: { id: user2.id } });
      console.log('✅ Usuário deletado!\n');
    } else {
      console.log('⚠️ Usuário pretimao não encontrado\n');
    }

    console.log('✅ Concluído!');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUsers();
