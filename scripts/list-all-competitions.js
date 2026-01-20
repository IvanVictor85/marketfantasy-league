/**
 * 📋 LISTAR TODAS AS COMPETIÇÕES
 *
 * Lista todas as competições do banco com detalhes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllCompetitions() {
  console.log('\n📋 LISTANDO TODAS AS COMPETIÇÕES\n');
  console.log('='.repeat(80));

  try {
    const competitions = await prisma.competition.findMany({
      orderBy: { startDate: 'asc' },
      include: {
        _count: {
          select: {
            userTeams: true,
            competitionTokens: true
          }
        }
      }
    });

    console.log(`\n📊 Total de competições: ${competitions.length}\n`);

    competitions.forEach((comp, index) => {
      const start = new Date(comp.startDate);
      const end = new Date(comp.endDate);

      console.log(`${index + 1}. ${comp.name || 'SEM NOME'} (${comp.id})`);
      console.log(`   Status: ${comp.status}`);
      console.log(`   Início: ${start.toLocaleString('pt-BR')}`);
      console.log(`   Fim: ${end.toLocaleString('pt-BR')}`);
      console.log(`   Times: ${comp._count.userTeams}`);
      console.log(`   Tokens: ${comp._count.competitionTokens}`);
      console.log(`   Prize Pool: ${Number(comp.prizePool)} SOL`);
      console.log('');
    });

    // Identificar as "Futuras" problemáticas
    console.log('='.repeat(80));
    console.log('\n🔍 ANÁLISE DAS COMPETIÇÕES:\n');

    const pending = competitions.filter(c => c.status === 'PENDING');
    const active = competitions.filter(c => c.status === 'ACTIVE');
    const completed = competitions.filter(c => c.status === 'COMPLETED');

    console.log(`✅ Completadas: ${completed.length}`);
    completed.forEach(c => {
      console.log(`   - ${c.name || c.id.substring(0, 8)} (${new Date(c.startDate).toLocaleDateString('pt-BR')})`);
    });

    console.log(`\n🟢 Ativa: ${active.length}`);
    active.forEach(c => {
      console.log(`   - ${c.name || c.id.substring(0, 8)} (${new Date(c.startDate).toLocaleDateString('pt-BR')})`);
    });

    console.log(`\n⏳ Pendentes (Futuras): ${pending.length}`);
    pending.forEach(c => {
      const hasTeams = c._count.userTeams > 0;
      const hasTokens = c._count.competitionTokens > 0;
      const status = hasTeams ? '👥 COM TIMES' : '❌ SEM TIMES';

      console.log(`   - ${c.name || c.id.substring(0, 8)} (${new Date(c.startDate).toLocaleDateString('pt-BR')}) - ${status} - ${c._count.competitionTokens} tokens`);
    });

    // Identificar competições suspeitas (sem nome, sem times, etc)
    console.log('\n' + '='.repeat(80));
    console.log('\n⚠️  COMPETIÇÕES SUSPEITAS (possíveis para exclusão):\n');

    const suspicious = competitions.filter(c => {
      // Competições PENDING sem nome ou sem times inscritos
      return (c.status === 'PENDING' && !c.name) ||
             (c.status === 'PENDING' && c._count.userTeams === 0);
    });

    if (suspicious.length > 0) {
      suspicious.forEach(c => {
        console.log(`❌ ${c.id}`);
        console.log(`   Nome: ${c.name || 'SEM NOME'}`);
        console.log(`   Status: ${c.status}`);
        console.log(`   Data: ${new Date(c.startDate).toLocaleDateString('pt-BR')} - ${new Date(c.endDate).toLocaleDateString('pt-BR')}`);
        console.log(`   Times: ${c._count.userTeams}`);
        console.log(`   Tokens: ${c._count.competitionTokens}`);
        console.log(`   Motivo: ${!c.name ? 'SEM NOME' : ''} ${c._count.userTeams === 0 ? 'SEM TIMES' : ''}`);
        console.log('');
      });

      console.log(`\n💡 Encontradas ${suspicious.length} competições suspeitas que podem ser excluídas.\n`);
    } else {
      console.log('✅ Nenhuma competição suspeita encontrada.\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('='.repeat(80));
  console.log('\n✅ Listagem concluída!\n');
}

listAllCompetitions();
