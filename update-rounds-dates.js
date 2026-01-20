const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const leagueId = 'cmh3qcrw80000cjvdrwtvt65i';

  // Pegar data/hora atual
  const now = new Date();
  console.log('📅 Data/hora atual:', now.toLocaleString('pt-BR'));

  // Criar data para hoje às 21h
  const rodada2Start = new Date(now);
  rodada2Start.setHours(21, 0, 0, 0);

  // Se já passou das 21h hoje, começar amanhã às 21h
  if (now.getHours() >= 21) {
    rodada2Start.setDate(rodada2Start.getDate() + 1);
  }

  // Rodada 2: Hoje 21h até amanhã 21h (24 horas)
  const rodada2End = new Date(rodada2Start);
  rodada2End.setDate(rodada2End.getDate() + 1);

  // Rodada 3: Logo após Rodada 2 (amanhã 21h até depois de amanhã 21h)
  const rodada3Start = new Date(rodada2End);
  const rodada3End = new Date(rodada3Start);
  rodada3End.setDate(rodada3End.getDate() + 1);

  // Rodada 4: Logo após Rodada 3
  const rodada4Start = new Date(rodada3End);
  const rodada4End = new Date(rodada4Start);
  rodada4End.setDate(rodada4End.getDate() + 1);

  console.log('\n📋 Novas datas das rodadas:');
  console.log('');
  console.log('Rodada 2:');
  console.log('  Início:', rodada2Start.toLocaleString('pt-BR'));
  console.log('  Fim:', rodada2End.toLocaleString('pt-BR'));
  console.log('');
  console.log('Rodada 3:');
  console.log('  Início:', rodada3Start.toLocaleString('pt-BR'));
  console.log('  Fim:', rodada3End.toLocaleString('pt-BR'));
  console.log('');
  console.log('Rodada 4:');
  console.log('  Início:', rodada4Start.toLocaleString('pt-BR'));
  console.log('  Fim:', rodada4End.toLocaleString('pt-BR'));
  console.log('');

  // Buscar rodadas
  const rodadas = await prisma.competition.findMany({
    where: { leagueId },
    orderBy: { startDate: 'asc' }
  });

  console.log('📊 Rodadas encontradas:', rodadas.length);

  // Identificar as rodadas
  const rodada2 = rodadas.find(r => r.name.includes('Rodada 2'));
  const rodada3 = rodadas.find(r => r.name.includes('Rodada 3'));
  const rodada4 = rodadas.find(r => r.name.includes('Rodada 4'));

  if (!rodada2 || !rodada3 || !rodada4) {
    console.error('❌ Não foi possível encontrar todas as rodadas!');
    console.log('Rodada 2:', rodada2?.name || 'NÃO ENCONTRADA');
    console.log('Rodada 3:', rodada3?.name || 'NÃO ENCONTRADA');
    console.log('Rodada 4:', rodada4?.name || 'NÃO ENCONTRADA');
    return;
  }

  console.log('');
  console.log('✅ Atualizando datas...');

  // Atualizar Rodada 2
  await prisma.competition.update({
    where: { id: rodada2.id },
    data: {
      startDate: rodada2Start,
      endDate: rodada2End,
      status: 'UPCOMING'
    }
  });
  console.log('✅ Rodada 2 atualizada');

  // Atualizar Rodada 3
  await prisma.competition.update({
    where: { id: rodada3.id },
    data: {
      startDate: rodada3Start,
      endDate: rodada3End,
      status: 'UPCOMING'
    }
  });
  console.log('✅ Rodada 3 atualizada');

  // Atualizar Rodada 4
  await prisma.competition.update({
    where: { id: rodada4.id },
    data: {
      startDate: rodada4Start,
      endDate: rodada4End,
      status: 'UPCOMING'
    }
  });
  console.log('✅ Rodada 4 atualizada');

  console.log('');
  console.log('🎉 Todas as rodadas foram atualizadas com sucesso!');

  await prisma.$disconnect();
}

main();
