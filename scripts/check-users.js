const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();

    console.log('📊 Total de usuários no banco:', users.length);
    console.log('\n👥 Lista de usuários:\n');

    users.forEach((u, index) => {
      console.log(`${index + 1}. ---`);
      console.log('   ID:', u.id);
      console.log('   Email:', u.email || '(sem email)');
      console.log('   PublicKey:', u.publicKey ? u.publicKey.slice(0, 20) + '...' : '(sem carteira)');
      console.log('   Name:', u.name || '(sem nome)');
      console.log('   Username:', u.username || '(sem username)');
      console.log('   Created:', u.createdAt);
      console.log('');
    });

    // Buscar especificamente os usuários mencionados
    console.log('\n🔍 Buscando usuários específicos:\n');

    const user1 = await prisma.user.findUnique({
      where: { email: 'pretimaoairdrops@gmail.com' }
    });

    const user2 = await prisma.user.findUnique({
      where: { email: 'pretimao@gmail.com' }
    });

    console.log('pretimaoairdrops@gmail.com:', user1 ? '✅ EXISTE' : '❌ NÃO ENCONTRADO');
    console.log('pretimao@gmail.com:', user2 ? '✅ EXISTE' : '❌ NÃO ENCONTRADO');

  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
