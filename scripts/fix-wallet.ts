#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixWallet() {
  console.log('🔧 Vinculando carteira ao usuário pretimaoairdrops...\n');

  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: 'pretimaoairdrops@gmail.com' }
    });

    if (!user) {
      console.error('❌ Usuário não encontrado!');
      console.log('\n💡 Usuários existentes no banco:');
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, publicKey: true }
      });
      console.table(allUsers);
      process.exit(1);
    }

    console.log('✅ Usuário encontrado:');
    console.log('   Email:', user.email);
    console.log('   ID:', user.id);
    console.log('   Nome:', user.name);
    console.log('   Carteira atual:', user.publicKey || 'NENHUMA');
    console.log('');

    // IMPORTANTE: Cole aqui o endereço da sua carteira Solana
    const WALLET_ADDRESS = 'H2312uRYYfSFsKiJeMwSriv6F7iEBkWxtPQCV6ArRAjT';

    if (WALLET_ADDRESS === 'H2312uRYYfSFsKiJeMwSriv6F7iEBkWxtPQCV6ArRAjT') {
      console.error('❌ Por favor, edite o script e coloque o endereço real da sua carteira!');
      console.error('   Abra: scripts/fix-wallet.ts');
      console.error('   Linha 26: const WALLET_ADDRESS = "SUA_CARTEIRA_AQUI"');
      console.error('');
      console.error('📋 Exemplo de endereço Solana:');
      console.error('   H231k8PASmuHTxVKZdqNLCNDpU5SWVfDRAJtFLPhRAJt');
      console.error('');
      process.exit(1);
    }

    // Validação básica do endereço
    if (WALLET_ADDRESS.length < 32 || WALLET_ADDRESS.length > 44) {
      console.error('❌ Endereço de carteira inválido!');
      console.error('   Endereços Solana têm entre 32 e 44 caracteres');
      console.error('   Você forneceu:', WALLET_ADDRESS.length, 'caracteres');
      process.exit(1);
    }

    console.log('🔍 Verificando se carteira já está em uso...');
    const existingWallet = await prisma.user.findFirst({
      where: {
        publicKey: WALLET_ADDRESS,
        id: { not: user.id }
      }
    });

    if (existingWallet) {
      console.error('❌ Esta carteira já está vinculada a outro usuário!');
      console.error('   Email do outro usuário:', existingWallet.email);
      console.error('   ID do outro usuário:', existingWallet.id);
      console.error('');
      console.error('💡 Opções:');
      console.error('   1. Use uma carteira diferente');
      console.error('   2. Faça login com a conta que já usa essa carteira');
      process.exit(1);
    }

    console.log('✅ Carteira disponível!');
    console.log('');

    // Atualizar carteira
    console.log('💾 Vinculando carteira ao usuário...');
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { publicKey: WALLET_ADDRESS }
    });

    console.log('');
    console.log('🎉 Carteira vinculada com sucesso!');
    console.log('');
    console.log('📋 Dados atualizados:');
    console.log('   Email:', updated.email);
    console.log('   ID:', updated.id);
    console.log('   Carteira:', updated.publicKey);
    console.log('');
    console.log('✅ Agora você pode usar essa carteira para entrar em ligas!');

  } catch (error) {
    console.error('❌ Erro ao vincular carteira:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
fixWallet()
  .then(() => {
    console.log('\n✅ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
