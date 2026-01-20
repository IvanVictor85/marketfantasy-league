/**
 * 🔍 VERIFICA PREÇOS DA RODADA TESTE
 *
 * Checa os preços da Rodada Teste (COMPLETED)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodadaTesteId = 'cmibxrcl40001e30u5hdwtwsg';

async function main() {
  console.log('\n🔍 VERIFICANDO PREÇOS DA RODADA TESTE\n');

  // Buscar competição
  const competition = await prisma.competition.findUnique({
    where: { id: rodadaTesteId },
    include: {
      competitionTokens: {
        orderBy: { symbol: 'asc' },
        take: 15  // Mostrar apenas 15 para não sobrecarregar
      },
      userTeams: {
        take: 5,
        orderBy: { totalPoints: 'desc' },
        include: {
          user: { select: { username: true, email: true } }
        }
      }
    }
  });

  if (!competition) {
    console.log('❌ Rodada Teste não encontrada');
    return;
  }

  console.log(`📊 Competição: ${competition.name}`);
  console.log(`📊 Status: ${competition.status}`);
  console.log(`📊 Times: ${competition.userTeams.length}\n`);

  // Verificar preços
  console.log('💰 PREÇOS SALVOS (amostra de 15 tokens):\n');

  competition.competitionTokens.forEach(ct => {
    const hasStart = ct.priceStart && Number(ct.priceStart) > 0;
    const hasEnd = ct.priceEnd && Number(ct.priceEnd) > 0;
    const hasPercent = ct.percentChange !== null;

    const priceStart = hasStart ? `$${Number(ct.priceStart).toFixed(2)}` : 'N/A';
    const priceEnd = hasEnd ? `$${Number(ct.priceEnd).toFixed(2)}` : 'N/A';
    const percent = hasPercent ? `${Number(ct.percentChange) > 0 ? '+' : ''}${Number(ct.percentChange).toFixed(2)}%` : 'N/A';

    console.log(`   ${ct.symbol.padEnd(8)} ${priceStart.padEnd(12)} → ${priceEnd.padEnd(12)} (${percent})`);
  });

  console.log('\n🏆 TOP 5 TIMES (totalPoints no banco):\n');

  competition.userTeams.forEach((team, i) => {
    const points = Number(team.totalPoints) || 0;
    console.log(`   ${i + 1}. ${team.teamName || 'Time sem nome'}`);
    console.log(`      Pontos: ${points.toFixed(2)}%`);
    console.log(`      Jogador: ${team.user.username || team.user.email}`);
    console.log('');
  });

  // Verificar datas dos snapshots
  const hasStartDates = competition.competitionTokens.some(ct => ct.priceStartDate);
  const hasEndDates = competition.competitionTokens.some(ct => ct.priceEndDate);

  console.log('📅 DATAS DOS SNAPSHOTS:\n');

  if (hasStartDates) {
    const sampleStart = competition.competitionTokens.find(ct => ct.priceStartDate);
    if (sampleStart) {
      console.log(`   Snapshot Inicial: ${sampleStart.priceStartDate}`);
    }
  } else {
    console.log('   Snapshot Inicial: SEM DATA');
  }

  if (hasEndDates) {
    const sampleEnd = competition.competitionTokens.find(ct => ct.priceEndDate);
    if (sampleEnd) {
      console.log(`   Snapshot Final: ${sampleEnd.priceEndDate}`);
    }
  } else {
    console.log('   Snapshot Final: SEM DATA');
  }

  console.log('\n✅ Verificação concluída!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
