const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCorruption() {
  try {
    const users = await prisma.user.findMany();

    console.log('📊 Total de usuários no banco:', users.length);
    console.log('\n👥 Lista completa de usuários:\n');

    users.forEach((u, index) => {
      console.log(`${index + 1}. ---`);
      console.log('   ID:', u.id);
      console.log('   Email:', u.email || '(null)');
      console.log('   PublicKey:', u.publicKey ? u.publicKey.slice(0, 20) + '...' : '(null)');
      console.log('   Name:', u.name || '(null)');
      console.log('   Username:', u.username || '(null)');
      console.log('');
    });

    // Procurar especificamente por corrupção (endereço de carteira no campo email)
    console.log('\n🔍 Procurando por corrupção (walletAddress no campo email):\n');

    const corruptedUsers = users.filter(u =>
      u.email && (u.email.includes('@wallet.mfl') || u.email.length > 40)
    );

    if (corruptedUsers.length > 0) {
      console.log('❌ CORRUPÇÃO ENCONTRADA!');
      console.log(`   Total de usuários corrompidos: ${corruptedUsers.length}\n`);

      corruptedUsers.forEach((u, i) => {
        console.log(`${i + 1}. Usuário corrompido:`);
        console.log('   ID:', u.id);
        console.log('   Email (CORROMPIDO):', u.email);
        console.log('   PublicKey:', u.publicKey || '(null)');
        console.log('   Name:', u.name);
        console.log('');
      });
    } else {
      console.log('✅ Nenhuma corrupção encontrada!');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCorruption();
