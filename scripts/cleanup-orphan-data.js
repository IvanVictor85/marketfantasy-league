/**
 * Script para limpar dados órfãos antes da migração
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando dados órfãos...\n');

  try {
    // Deletar competition_tokens órfãos
    const deletedCompTokens = await prisma.$executeRaw`
      DELETE FROM competition_tokens
      WHERE "tokenId" NOT IN (SELECT id FROM tokens)
    `;
    console.log(`✅ Removidos ${deletedCompTokens} competition_tokens órfãos`);

    // Deletar competition_tokens de competições inexistentes
    const deletedCompTokens2 = await prisma.$executeRaw`
      DELETE FROM competition_tokens
      WHERE "competitionId" NOT IN (SELECT id FROM competitions)
    `;
    console.log(`✅ Removidos ${deletedCompTokens2} competition_tokens de competições inexistentes`);

    console.log('\n✨ Limpeza concluída!');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
