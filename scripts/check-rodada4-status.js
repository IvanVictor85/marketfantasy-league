const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRodada4Status() {
  try {
    console.log('🔍 Verificando status da Rodada 4...\n');

    // Buscar a liga principal
    const mainLeague = await prisma.league.findFirst({
      where: {
        name: {
          contains: 'Principal'
        }
      },
      select: {
        id: true,
        name: true,
        entryFee: true
      }
    });

    if (!mainLeague) {
      console.log('❌ Liga principal não encontrada');
      return;
    }

    console.log('📋 Liga Principal:', {
      id: mainLeague.id,
      name: mainLeague.name,
      entryFee: mainLeague.entryFee.toString()
    });

    // Buscar todas as competições da liga
    const competitions = await prisma.competition.findMany({
      where: {
        leagueId: mainLeague.id
      },
      orderBy: {
        startDate: 'asc'
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        _count: {
          select: {
            userTeams: true
          }
        }
      }
    });

    console.log(`\n📊 Competições encontradas: ${competitions.length}\n`);

    const now = new Date();

    competitions.forEach((comp, index) => {
      const isActive = comp.status === 'ACTIVE';
      const isPending = comp.status === 'PENDING';
      const isCompleted = comp.status === 'COMPLETED';

      const start = comp.startDate ? new Date(comp.startDate) : null;
      const end = comp.endDate ? new Date(comp.endDate) : null;

      let timeInfo = '';
      if (start && end) {
        const beforeStart = now < start;
        const afterEnd = now > end;
        const inProgress = now >= start && now <= end;

        if (beforeStart) {
          const hoursUntilStart = Math.floor((start - now) / (1000 * 60 * 60));
          timeInfo = `⏳ Inicia em ${hoursUntilStart}h`;
        } else if (inProgress) {
          const hoursUntilEnd = Math.floor((end - now) / (1000 * 60 * 60));
          timeInfo = `🔴 EM ANDAMENTO (${hoursUntilEnd}h restantes)`;
        } else if (afterEnd) {
          const hoursAfterEnd = Math.floor((now - end) / (1000 * 60 * 60));
          timeInfo = `✅ Terminou há ${hoursAfterEnd}h`;
        }
      }

      const statusEmoji = isCompleted ? '✅' : isActive ? '▶️' : '⏸️';

      console.log(`${statusEmoji} ${comp.name || `Rodada ${index + 1}`}`);
      console.log(`   ID: ${comp.id}`);
      console.log(`   Status: ${comp.status}`);
      console.log(`   Início: ${start ? start.toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`   Fim: ${end ? end.toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`   Times: ${comp._count.userTeams}`);
      console.log(`   ${timeInfo}`);

      // ⚠️ ALERTA: Status inconsistente
      if (isActive && end && now > end) {
        console.log(`   ⚠️ PROBLEMA: Status é ACTIVE mas data de término já passou!`);
        console.log(`   ⚠️ Deveria ser COMPLETED`);
      }

      console.log('');
    });

    // Identificar qual competição está ativa
    const activeCompetition = competitions.find(c => c.status === 'ACTIVE');

    if (activeCompetition) {
      console.log(`\n🎯 Competição Ativa: ${activeCompetition.name || 'Sem nome'}`);
      console.log(`   Status no DB: ${activeCompetition.status}`);

      if (activeCompetition.endDate) {
        const end = new Date(activeCompetition.endDate);
        if (now > end) {
          console.log(`\n❌ PROBLEMA IDENTIFICADO:`);
          console.log(`   - A competição está com status ACTIVE no banco`);
          console.log(`   - Mas a data de término (${end.toLocaleString('pt-BR')}) já passou`);
          console.log(`   - O MainLeagueCard interpreta isso como "FINISHED"`);
          console.log(`   - SOLUÇÃO: Rodar o cron job de finalização de competição`);
        } else {
          console.log(`\n✅ Status OK: Competição ainda não terminou`);
        }
      }
    } else {
      console.log('\n⚠️ Nenhuma competição com status ACTIVE encontrada');
    }

    console.log('\n📅 Data/Hora Atual:', now.toLocaleString('pt-BR'));

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRodada4Status();
