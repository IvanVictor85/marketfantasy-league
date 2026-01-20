const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeForeignKey() {
  console.log('🔧 Removendo foreign key constraint...\n');

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "competition_tokens" DROP CONSTRAINT IF EXISTS "competition_tokens_tokenId_fkey";
    `);

    console.log('✅ Foreign key removida com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

removeForeignKey();
