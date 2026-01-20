/**
 * 🔍 VERIFICAR DATAS DE CRIAÇÃO DAS COMPETIÇÕES
 *
 * Analisa as datas de criação para entender o padrão
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCreationDates() {
  console.log('\n🔍 ANALISANDO DATAS DE CRIAÇÃO DAS COMPETIÇÕES\n');
  console.log('='.repeat(80));

  try {
    const competitions = await prisma.competition.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`\n📊 Total: ${competitions.length} competições\n`);

    competitions.forEach((comp, index) => {
      const created = new Date(comp.createdAt);
      const updated = new Date(comp.updatedAt);
      const start = new Date(comp.startDate);
      const end = new Date(comp.endDate);

      console.log(`${index + 1}. ${comp.name || 'SEM NOME'}`);
      console.log(`   ID: ${comp.id}`);
      console.log(`   Status: ${comp.status}`);
      console.log(`   Criada em: ${created.toLocaleString('pt-BR')}`);
      console.log(`   Atualizada em: ${updated.toLocaleString('pt-BR')}`);
      console.log(`   Início: ${start.toLocaleString('pt-BR')}`);
      console.log(`   Fim: ${end.toLocaleString('pt-BR')}`);
      console.log(`   Duração: ${Math.round((end - start) / (1000 * 60 * 60 * 24))} dias`);
      console.log('');
    });

    // Análise de padrões
    console.log('='.repeat(80));
    console.log('\n📊 ANÁLISE DE PADRÕES:\n');

    // Verificar durações
    const durations = competitions.map(c => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      return {
        name: c.name || c.id.substring(0, 8),
        days: Math.round((end - start) / (1000 * 60 * 60 * 24))
      };
    });

    console.log('Durações das competições:');
    durations.forEach(d => {
      const warning = d.days !== 1 ? '⚠️' : '✅';
      console.log(`   ${warning} ${d.name}: ${d.days} dia(s)`);
    });

    // Verificar intervalos entre criações
    console.log('\n\nIntervalos entre finalizações (createdAt das próximas):\n');
    for (let i = 1; i < competitions.length; i++) {
      const prev = new Date(competitions[i - 1].createdAt);
      const curr = new Date(competitions[i].createdAt);
      const diff = Math.round((curr - prev) / (1000 * 60));

      console.log(`   ${competitions[i - 1].name || 'SEM NOME'} → ${competitions[i].name || 'SEM NOME'}: ${diff} minutos`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Análise concluída!\n');
}

checkCreationDates();
