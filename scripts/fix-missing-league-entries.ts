/**
 * Script para Corrigir Entradas de Liga Faltantes
 *
 * Identifica times que não têm LeagueEntry correspondente e cria os registros faltantes
 *
 * Executar: npx tsx scripts/fix-missing-league-entries.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Iniciando correção de LeagueEntry faltantes...\n');

  try {
    // 1. Buscar liga principal
    console.log('📋 Buscando liga principal (MAIN)...');
    const mainLeague = await prisma.league.findFirst({
      where: { leagueType: 'MAIN' }
    });

    if (!mainLeague) {
      console.error('❌ Liga principal não encontrada!');
      return;
    }

    console.log(`✅ Liga encontrada: ${mainLeague.name} (ID: ${mainLeague.id})`);

    // 2. Buscar todos os times da liga principal
    console.log('\n🔍 Buscando times da liga principal...');
    const allTeams = await prisma.team.findMany({
      where: { leagueId: mainLeague.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            publicKey: true
          }
        }
      }
    });

    console.log(`✅ Encontrados ${allTeams.length} times na liga`);

    // 3. Buscar todas as entradas de liga existentes
    console.log('\n🔍 Buscando entradas de liga existentes...');
    const existingEntries = await prisma.leagueEntry.findMany({
      where: { leagueId: mainLeague.id }
    });

    console.log(`✅ Encontradas ${existingEntries.length} entradas de liga`);

    // 4. Identificar times sem LeagueEntry
    console.log('\n🔍 Identificando times sem LeagueEntry...');
    const existingUserIds = new Set(existingEntries.map(entry => entry.userId));

    const teamsWithoutEntry = allTeams.filter(team => !existingUserIds.has(team.userId));

    if (teamsWithoutEntry.length === 0) {
      console.log('\n✅ Todos os times já possuem LeagueEntry correspondente!');
      console.log('   Nenhuma correção necessária.');
      return;
    }

    console.log(`⚠️  Encontrados ${teamsWithoutEntry.length} times SEM LeagueEntry:`);
    teamsWithoutEntry.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.teamName} (Usuário: ${team.user.email})`);
    });

    // 5. Criar LeagueEntry para cada time faltante
    console.log('\n💾 Criando entradas de liga faltantes...');

    for (let i = 0; i < teamsWithoutEntry.length; i++) {
      const team = teamsWithoutEntry[i];

      const entry = await prisma.leagueEntry.create({
        data: {
          leagueId: mainLeague.id,
          userId: team.userId,
          userWallet: team.userWallet || team.user.publicKey || 'NO_WALLET',
          transactionHash: `FIX_${Date.now()}_${i}`,
          amountPaid: mainLeague.entryFee,
          status: 'CONFIRMED',
          blockHeight: 999999999 + i
        }
      });

      console.log(`   ✅ ${i + 1}/${teamsWithoutEntry.length} - LeagueEntry criada para: ${team.teamName}`);
      console.log(`      Transaction Hash: ${entry.transactionHash}`);
    }

    // 6. Atualizar contadores da liga
    console.log('\n🔄 Atualizando contadores da liga...');

    const totalEntries = await prisma.leagueEntry.count({
      where: {
        leagueId: mainLeague.id,
        status: 'CONFIRMED'
      }
    });

    await prisma.league.update({
      where: { id: mainLeague.id },
      data: {
        participantCount: totalEntries,
        totalPrizePool: totalEntries * mainLeague.entryFee
      }
    });

    console.log(`✅ Liga atualizada: ${totalEntries} participantes confirmados`);

    // 7. Resumo final
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 Liga: ${mainLeague.name}`);
    console.log(`👥 Total de times: ${allTeams.length}`);
    console.log(`✅ Total de entradas: ${totalEntries}`);
    console.log(`➕ Entradas criadas: ${teamsWithoutEntry.length}`);
    console.log(`💰 Prize Pool: ${totalEntries * mainLeague.entryFee} SOL`);
    console.log('═══════════════════════════════════════════════════\n');

    console.log('✨ Todos os times agora possuem LeagueEntry correspondente!\n');

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
