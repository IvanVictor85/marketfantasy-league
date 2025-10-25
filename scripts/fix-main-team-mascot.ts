/**
 * Script para Corrigir selectedMascotUrl do Time Principal
 *
 * Preenche o campo selectedMascotUrl do time do usuário principal
 * (pretimaoairdrops@gmail.com) com uma URL do DiceBear para consistência na demo
 *
 * Executar: npx tsx scripts/fix-main-team-mascot.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Iniciando correção do mascote do time principal...\n');

  try {
    // 1. Buscar o usuário principal
    console.log('🔍 Buscando usuário principal (pretimaoairdrops@gmail.com)...');
    const mainUser = await prisma.user.findUnique({
      where: { email: 'pretimaoairdrops@gmail.com' }
    });

    if (!mainUser) {
      console.error('❌ Usuário principal não encontrado!');
      return;
    }

    console.log(`✅ Usuário encontrado: ${mainUser.name} (ID: ${mainUser.id})`);

    // 2. Buscar o time do usuário principal
    console.log('\n🔍 Buscando time do usuário principal...');
    const mainTeam = await prisma.team.findFirst({
      where: { userId: mainUser.id }
    });

    if (!mainTeam) {
      console.error('❌ Time do usuário principal não encontrado!');
      return;
    }

    console.log(`✅ Time encontrado: ${mainTeam.teamName}`);
    console.log(`   selectedMascotUrl atual: ${mainTeam.selectedMascotUrl || 'null'}`);

    // 3. Verificar se já tem mascot
    if (mainTeam.selectedMascotUrl) {
      console.log('\n⚠️  Time já possui selectedMascotUrl. Deseja sobrescrever?');
      console.log('   Para sobrescrever, execute: npx tsx scripts/fix-main-team-mascot.ts --force');

      // Verificar se flag --force foi passada
      if (!process.argv.includes('--force')) {
        console.log('\n✋ Operação cancelada. Use --force para sobrescrever.');
        return;
      }
      console.log('🔄 Flag --force detectada. Sobrescrevendo...');
    }

    // 4. Gerar URL do DiceBear baseada no nome do time
    const teamNameForSeed = mainTeam.teamName.replace(/\s+/g, '');
    const mascotUrl = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${teamNameForSeed}`;

    console.log(`\n🎨 Nova URL do mascote: ${mascotUrl}`);

    // 5. Atualizar o campo selectedMascotUrl
    console.log('\n💾 Atualizando time no banco de dados...');
    const updatedTeam = await prisma.team.update({
      where: { id: mainTeam.id },
      data: { selectedMascotUrl: mascotUrl }
    });

    console.log('✅ Time atualizado com sucesso!');
    console.log(`   ID: ${updatedTeam.id}`);
    console.log(`   Nome: ${updatedTeam.teamName}`);
    console.log(`   selectedMascotUrl: ${updatedTeam.selectedMascotUrl}`);

    // 6. Resumo final
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`👤 Usuário: ${mainUser.name}`);
    console.log(`⚽ Time: ${updatedTeam.teamName}`);
    console.log(`🎨 Mascote: ${updatedTeam.selectedMascotUrl}`);
    console.log('═══════════════════════════════════════════════════\n');

    console.log('✨ O time principal agora tem um mascote DiceBear consistente com a demo!\n');

  } catch (error) {
    console.error('❌ Erro ao executar correção:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar correção
main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
