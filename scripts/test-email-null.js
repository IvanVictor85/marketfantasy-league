const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEmailNull() {
  try {
    console.log('🧪 Testando criação de usuário com email null...\n');

    // Tentar criar um usuário de teste com email null
    const testWallet = 'TEST' + Date.now() + 'WALLET';

    console.log('📝 Tentando criar usuário com:');
    console.log('   publicKey:', testWallet);
    console.log('   email: null');
    console.log('   name: "Teste Email Null"');
    console.log('');

    const testUser = await prisma.user.create({
      data: {
        publicKey: testWallet,
        email: null,
        name: 'Teste Email Null'
      }
    });

    console.log('✅ SUCESSO! Usuário criado com email null:');
    console.log('   ID:', testUser.id);
    console.log('   Email:', testUser.email);
    console.log('   PublicKey:', testUser.publicKey);
    console.log('   Name:', testUser.name);
    console.log('');

    // Deletar o usuário de teste
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('🗑️  Usuário de teste removido');
    console.log('');
    console.log('✨ Teste concluído! O schema está correto e o banco aceita email null.');

  } catch (error) {
    console.error('❌ ERRO! Não foi possível criar usuário com email null:');
    console.error('');
    console.error('Mensagem:', error.message);
    console.error('');
    console.error('🔍 Isso significa que:');
    console.error('   1. O schema.prisma tem email opcional (String?)');
    console.error('   2. MAS o banco de dados ainda tem email como obrigatório (NOT NULL)');
    console.error('');
    console.error('📋 Solução:');
    console.error('   Execute: npx prisma db push --force-reset');
    console.error('   ⚠️  ATENÇÃO: Isso vai APAGAR todos os dados!');
    console.error('');
    console.error('   OU execute manualmente no banco:');
    console.error('   ALTER TABLE users ALTER COLUMN email DROP NOT NULL;');
  } finally {
    await prisma.$disconnect();
  }
}

testEmailNull();
