const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function recreateUsers() {
  try {
    console.log('🔧 Recriando usuários deletados...\n');

    // USUÁRIO 1: pretimao@gmail.com
    console.log('📝 Criando usuário: pretimao@gmail.com');

    const user1 = await prisma.user.create({
      data: {
        email: 'pretimao@gmail.com',
        name: 'Pretimao',
        username: null, // Será preenchido pelo usuário no perfil
        publicKey: null, // Usuário de email, sem carteira
      }
    });

    console.log('✅ Usuário 1 criado:');
    console.log('   ID:', user1.id);
    console.log('   Email:', user1.email);
    console.log('   Name:', user1.name);
    console.log('   Tipo: Login por Email (código de verificação)\n');

    // USUÁRIO 2: pretimaoairdrops@gmail.com
    console.log('📝 Criando usuário: pretimaoairdrops@gmail.com');

    const user2 = await prisma.user.create({
      data: {
        email: 'pretimaoairdrops@gmail.com',
        name: 'Sport Club Receba', // Nome do time mencionado
        username: null, // Será preenchido pelo usuário no perfil
        publicKey: null, // Usuário de email, sem carteira
      }
    });

    console.log('✅ Usuário 2 criado:');
    console.log('   ID:', user2.id);
    console.log('   Email:', user2.email);
    console.log('   Name:', user2.name);
    console.log('   Tipo: Login por Email (código de verificação)\n');

    console.log('✨ Usuários recriados com sucesso!');
    console.log('\n📋 Informações importantes:');
    console.log('   ✅ Ambos os usuários foram criados como LOGIN POR EMAIL');
    console.log('   ✅ Não usam senha, apenas código de verificação por email');
    console.log('   ✅ Ao fazer login, um código será enviado para o email');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Acesse a página de login');
    console.log('   2. Insira o email (pretimao@gmail.com ou pretimaoairdrops@gmail.com)');
    console.log('   3. Clique em "Enviar Código"');
    console.log('   4. Verifique o email e insira o código de 6 dígitos');
    console.log('   5. Complete o perfil (/perfil) com username e outras informações');
    console.log('   6. Crie o time novamente se necessário');

    console.log('\n⚠️  NOTA: Os times antigos NÃO foram restaurados.');
    console.log('    Você precisará recriar os times manualmente.');

  } catch (error) {
    console.error('❌ Erro ao recriar usuários:', error.message);

    if (error.code === 'P2002') {
      console.log('\n⚠️  Erro: Usuário já existe no banco.');
      console.log('    Verifique os usuários existentes com:');
      console.log('    node scripts/check-users.js');
    } else {
      console.error('Detalhes do erro:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

recreateUsers();
