const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCroTokenId() {
  console.log('🔧 Corrigindo o ID do token CRO...\n');

  const competitionId = 'cmi1pvmrn0001q9qvbjejtuly';

  // Buscar o token CRO
  const croToken = await prisma.competitionToken.findFirst({
    where: {
      competitionId,
      symbol: 'CRO'
    }
  });

  if (!croToken) {
    console.log('❌ Token CRO não encontrado!');
    await prisma.$disconnect();
    return;
  }

  console.log(`📊 Token CRO encontrado:`);
  console.log(`   ID atual: ${croToken.tokenId}`);
  console.log(`   Nome: ${croToken.name}`);
  console.log(`   Símbolo: ${croToken.symbol}\n`);

  // Atualizar para o ID correto
  const correctId = 'crypto-com-chain';

  if (croToken.tokenId === correctId) {
    console.log(`✅ O token CRO já está com o ID correto: ${correctId}`);
  } else {
    console.log(`🔄 Atualizando ID: ${croToken.tokenId} → ${correctId}\n`);

    await prisma.competitionToken.update({
      where: { id: croToken.id },
      data: { tokenId: correctId }
    });

    console.log('✅ Token CRO atualizado com sucesso!');
  }

  await prisma.$disconnect();
}

fixCroTokenId();
