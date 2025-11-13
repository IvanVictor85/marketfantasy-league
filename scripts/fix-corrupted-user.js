const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCorruptedUser() {
  try {
    console.log('🔧 Corrigindo usuário corrompido...\n');

    const corruptedUserId = 'cmhtv8rfg0001dedpeji0x2bw';

    // Buscar o usuário corrompido
    const user = await prisma.user.findUnique({
      where: { id: corruptedUserId }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('📋 Usuário ANTES da correção:');
    console.log('   ID:', user.id);
    console.log('   Email (CORROMPIDO):', user.email);
    console.log('   PublicKey:', user.publicKey);
    console.log('   Name:', user.name);
    console.log('   Username:', user.username);
    console.log('');

    // Corrigir: remover o email fake @wallet.mfl
    const updatedUser = await prisma.user.update({
      where: { id: corruptedUserId },
      data: {
        email: null // Remover o email fake
      }
    });

    console.log('✅ Usuário CORRIGIDO:');
    console.log('   ID:', updatedUser.id);
    console.log('   Email:', updatedUser.email || '(null - correto!)');
    console.log('   PublicKey:', updatedUser.publicKey);
    console.log('   Name:', updatedUser.name);
    console.log('   Username:', updatedUser.username);
    console.log('');

    console.log('✨ Correção concluída!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('   1. O usuário pode agora adicionar um email real via /perfil');
    console.log('   2. O email será verificado com código de 6 dígitos');
    console.log('   3. Após verificação, o email real será salvo no banco');

  } catch (error) {
    console.error('❌ Erro ao corrigir usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCorruptedUser();
