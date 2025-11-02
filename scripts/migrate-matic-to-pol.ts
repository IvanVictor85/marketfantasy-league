/**
 * Script para migrar MATIC para POL nos times
 *
 * MATIC foi rebrandado para POL (Polygon)
 * Este script atualiza todos os times que têm MATIC escalado
 *
 * Uso: npx tsx scripts/migrate-matic-to-pol.ts
 */

import { prisma } from '../src/lib/prisma';

async function migrateMaticToPol() {
  console.log('🔄 Migrando MATIC → POL nos times...\n');

  try {
    // Buscar todos os times
    const allTeams = await prisma.team.findMany({
      select: {
        id: true,
        teamName: true,
        tokens: true,
        userWallet: true,
        leagueId: true
      }
    });

    console.log(`📊 Total de times encontrados: ${allTeams.length}\n`);

    const teamsToUpdate: Array<{
      id: string;
      teamName: string;
      oldTokens: string[];
      newTokens: string[];
    }> = [];

    // Identificar times com MATIC
    for (const team of allTeams) {
      try {
        const tokens = JSON.parse(team.tokens) as string[];

        // Verificar se tem MATIC
        const hasMatic = tokens.some(t => t.toUpperCase() === 'MATIC');

        if (hasMatic) {
          const newTokens = tokens.map(t =>
            t.toUpperCase() === 'MATIC' ? 'POL' : t
          );

          teamsToUpdate.push({
            id: team.id,
            teamName: team.teamName,
            oldTokens: tokens,
            newTokens: newTokens
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao parsear tokens do time ${team.teamName}:`, error);
      }
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 TIMES COM MATIC ENCONTRADOS');
    console.log('═══════════════════════════════════════════════════════\n');

    if (teamsToUpdate.length === 0) {
      console.log('✅ Nenhum time com MATIC encontrado. Nada a fazer!\n');
      return;
    }

    console.log(`⚠️  ${teamsToUpdate.length} time(s) encontrado(s) com MATIC:\n`);

    teamsToUpdate.forEach((team, index) => {
      console.log(`${index + 1}. ${team.teamName}`);
      console.log(`   Antes: ${team.oldTokens.join(', ')}`);
      console.log(`   Depois: ${team.newTokens.join(', ')}`);
      console.log('');
    });

    // Confirmar antes de prosseguir
    console.log('═══════════════════════════════════════════════════════');
    console.log('⚠️  ATENÇÃO: Iniciando atualização...\n');

    let updatedCount = 0;
    let errorCount = 0;

    for (const team of teamsToUpdate) {
      try {
        await prisma.team.update({
          where: { id: team.id },
          data: {
            tokens: JSON.stringify(team.newTokens)
          }
        });

        console.log(`✅ ${team.teamName} - Atualizado com sucesso`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ ${team.teamName} - Erro ao atualizar:`, error);
        errorCount++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Times encontrados com MATIC: ${teamsToUpdate.length}`);
    console.log(`Times atualizados com sucesso: ${updatedCount} ✅`);
    console.log(`Erros durante atualização: ${errorCount} ${errorCount > 0 ? '❌' : ''}`);
    console.log('');

    if (updatedCount > 0) {
      console.log('✅ Migração MATIC → POL concluída com sucesso!');
      console.log('');
      console.log('🔔 Próximos passos recomendados:');
      console.log('   1. Verificar se POL está na lista de tokens válidos');
      console.log('   2. Atualizar documentação se necessário');
      console.log('   3. Notificar usuários afetados sobre a mudança');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro fatal durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
migrateMaticToPol()
  .then(() => {
    console.log('✅ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  });
