#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function linkBothWallets() {
  console.log('🔗 Vinculando carteiras aos usuários...\n');

  try {
    // Configuração dos usuários e carteiras
    const users = [
      {
        email: 'pretimaoairdrops@gmail.com',
        wallet: 'H2312uRYYfSFsKiJeMwSriv6F7iEBkWxtPQCV6ArRAJT'
      },
      {
        email: 'pretimao@gmail.com',
        wallet: '3GLFWDvTtxdmq6rSRFfeYExYVfpL5PTBR6LpfNq2eeFw'
      }
    ];

    for (const config of users) {
      console.log(`📧 Processando: ${config.email}`);

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email: config.email }
      });

      if (!user) {
        console.error(`   ❌ Usuário não encontrado: ${config.email}\n`);
        continue;
      }

      console.log(`   ✅ Usuário encontrado (ID: ${user.id})`);
      console.log(`   📝 Carteira atual: ${user.publicKey || 'NENHUMA'}`);

      // Verificar se a nova carteira já está em uso
      const existingWallet = await prisma.user.findFirst({
        where: {
          publicKey: config.wallet,
          id: { not: user.id }
        }
      });

      if (existingWallet) {
        console.error(`   ❌ Carteira já em uso por: ${existingWallet.email}\n`);
        continue;
      }

      // Atualizar carteira
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { publicKey: config.wallet }
      });

      console.log(`   ✅ Carteira vinculada: ${config.wallet.substring(0, 10)}...`);
      console.log('');
    }

    // Verificar resultado final
    console.log('📊 Resultado final:\n');
    const allUsers = await prisma.user.findMany({
      select: { email: true, publicKey: true }
    });

    allUsers.forEach(user => {
      console.log(`   ${user.email}`);
      console.log(`   └─ ${user.publicKey || '❌ SEM CARTEIRA'}\n`);
    });

    console.log('🎉 Processo concluído!\n');

  } catch (error) {
    console.error('❌ Erro ao vincular carteiras:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

linkBothWallets()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
