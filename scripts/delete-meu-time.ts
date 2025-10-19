/**
 * Script para deletar o time "Meu Time" que tem tokens UNKNOWN
 *
 * Execute: npx tsx scripts/delete-meu-time.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteMeuTime() {
  try {
    console.log('🗑️  Buscando e deletando time "Meu Time"...\n');

    // Deletar por nome
    const deletedByName = await prisma.team.deleteMany({
      where: { teamName: "Meu Time" }
    });

    // Deletar por wallet (caso o nome seja diferente)
    const deletedByWallet = await prisma.team.deleteMany({
      where: { userWallet: "H2312uRYYfSFsKiJeMwSriv6F7iEBkWxtPQCV6ArRAjT" }
    });

    const totalDeleted = deletedByName.count + deletedByWallet.count;

    if (totalDeleted > 0) {
      console.log(`✅ ${totalDeleted} time(s) deletado(s) com sucesso!\n`);
    } else {
      console.log('ℹ️  Nenhum time encontrado para deletar.\n');
    }

    // Mostrar times restantes
    const remainingTeams = await prisma.team.findMany({
      select: {
        teamName: true,
        totalScore: true,
        rank: true,
      },
      orderBy: {
        totalScore: 'desc',
      },
    });

    console.log('📊 Times restantes:');
    remainingTeams.forEach((team, index) => {
      console.log(`   ${index + 1}º - ${team.teamName} - ${team.totalScore?.toFixed(2) || 0} pts`);
    });

    console.log('\n✨ Limpeza concluída!\n');

  } catch (error) {
    console.error('❌ Erro ao deletar time:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
deleteMeuTime()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
