/**
 * 🗑️ EXCLUIR COMPETIÇÕES ÓRFÃS
 *
 * Remove competições PENDING sem nome e sem times
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const competitionsToDelete = [
  'cmiqw7umd000y10v7j4t3x9dg', // 05/12 - 10/12
  'cmixuypb6003k3phyelqcksa8'  // 07/12 - 12/12
];

async function deleteOrphanCompetitions() {
  console.log('\n🗑️ EXCLUINDO COMPETIÇÕES ÓRFÃS\n');
  console.log('='.repeat(80));

  try {
    for (const compId of competitionsToDelete) {
      console.log(`\n🔍 Verificando competição: ${compId}\n`);

      // Buscar detalhes
      const comp = await prisma.competition.findUnique({
        where: { id: compId },
        include: {
          _count: {
            select: {
              userTeams: true,
              competitionTokens: true
            }
          }
        }
      });

      if (!comp) {
        console.log('⚠️  Competição não encontrada (já excluída?)');
        continue;
      }

      console.log(`📊 Nome: ${comp.name || 'SEM NOME'}`);
      console.log(`   Status: ${comp.status}`);
      console.log(`   Início: ${new Date(comp.startDate).toLocaleString('pt-BR')}`);
      console.log(`   Fim: ${new Date(comp.endDate).toLocaleString('pt-BR')}`);
      console.log(`   Times: ${comp._count.userTeams}`);
      console.log(`   Tokens: ${comp._count.competitionTokens}`);

      // Validação de segurança
      if (comp._count.userTeams > 0) {
        console.log('\n❌ ATENÇÃO! Esta competição tem times inscritos!');
        console.log('   Pulando exclusão por segurança...\n');
        continue;
      }

      if (comp.status !== 'PENDING') {
        console.log('\n❌ ATENÇÃO! Esta competição não está PENDING!');
        console.log('   Pulando exclusão por segurança...\n');
        continue;
      }

      // Confirmar exclusão
      console.log('\n✅ Seguro para excluir (PENDING + sem times)');
      console.log('   Excluindo...');

      // 1. Excluir CompetitionTokens primeiro (dependência)
      const deletedTokens = await prisma.competitionToken.deleteMany({
        where: { competitionId: compId }
      });

      console.log(`   🗑️  ${deletedTokens.count} tokens excluídos`);

      // 2. Excluir PriceHistory relacionado (se houver)
      const deletedHistory = await prisma.priceHistory.deleteMany({
        where: {
          OR: [
            { source: `competition_start_${compId}` },
            { source: `competition_end_${compId}` }
          ]
        }
      });

      console.log(`   🗑️  ${deletedHistory.count} registros de priceHistory excluídos`);

      // 3. Excluir a competição
      await prisma.competition.delete({
        where: { id: compId }
      });

      console.log(`   ✅ Competição excluída com sucesso!\n`);
    }

    console.log('='.repeat(80));
    console.log('\n✅ PROCESSO CONCLUÍDO!\n');

    // Listar competições restantes
    const remaining = await prisma.competition.findMany({
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true
      }
    });

    console.log('📋 COMPETIÇÕES RESTANTES:\n');
    remaining.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name || c.id.substring(0, 8)} - ${c.status} (${new Date(c.startDate).toLocaleDateString('pt-BR')})`);
    });

    console.log(`\n📊 Total: ${remaining.length} competições\n`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('='.repeat(80));
  console.log('\n✅ Processo finalizado!\n');
}

deleteOrphanCompetitions();
