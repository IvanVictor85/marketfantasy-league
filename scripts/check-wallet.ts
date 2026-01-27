/**
 * Script para verificar se uma carteira está vinculada a alguma conta
 * 
 * Uso: npx tsx scripts/check-wallet.ts 3GLFWDvTtxdmq6rSRFfeYExYVfpL5PTBR6LpfNq2eeFw
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWallet(publicKey: string) {
  console.log(`🔍 Verificando carteira: ${publicKey}\n`);

  // Buscar usuário com essa carteira
  const user = await prisma.user.findUnique({
    where: { publicKey },
    include: {
      referredBy: {
        select: {
          id: true,
          name: true,
          email: true,
          referralCode: true
        }
      }
    }
  });

  if (!user) {
    console.log('✅ Carteira NÃO está vinculada a nenhuma conta');
    console.log('   Pode ser vinculada normalmente\n');
    return;
  }

  console.log('⚠️  Carteira JÁ está vinculada a uma conta:\n');
  console.log(`📊 Dados do usuário:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email || 'N/A'}`);
  console.log(`   Nome: ${user.name}`);
  console.log(`   Username: ${user.username || 'N/A'}`);
  console.log(`   Carteira: ${user.publicKey}`);
  console.log(`   Código Referral: ${user.referralCode || 'N/A'}`);
  
  if (user.referredBy) {
    console.log(`\n🔗 Referenciado por:`);
    console.log(`   Nome: ${user.referredBy.name}`);
    console.log(`   Email: ${user.referredBy.email || 'N/A'}`);
    console.log(`   Código: ${user.referredBy.referralCode}`);
  } else {
    console.log(`\n🔗 Não foi referenciado por ninguém`);
  }

  console.log(`\n❌ Esta carteira NÃO pode ser vinculada a outra conta!`);
  console.log(`   Para desvincular, delete o usuário: npx tsx scripts/delete-user.ts ${user.email || user.id}\n`);
}

// Executar
const publicKey = process.argv[2];

if (!publicKey) {
  console.error('❌ Erro: Forneça uma carteira pública como argumento');
  console.log('   Uso: npx tsx scripts/check-wallet.ts 3GLFWDvT...');
  process.exit(1);
}

checkWallet(publicKey)
  .then(() => {
    console.log('✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao verificar carteira:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
