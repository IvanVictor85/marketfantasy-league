import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLeagueWindow() {
  try {
    console.log('🔧 Atualizando janela da Liga Principal...');

    // Buscar a Liga Principal
    const mainLeague = await prisma.league.findFirst({
      where: { 
        name: 'Liga Principal CryptoFantasy',
        leagueType: 'MAIN'
      }
    });

    if (!mainLeague) {
      console.error('❌ Liga Principal não encontrada');
      return;
    }

    console.log('✅ Liga Principal encontrada:', {
      id: mainLeague.id,
      name: mainLeague.name,
      status: mainLeague.status
    });

    // Definir as datas da janela de pontuação/edição (Horário de Brasília, GMT-3)
    const roundStartDate = new Date('2025-10-25T10:00:00-03:00'); // 25 de Outubro de 2025, 10:00 AM
    const roundEndDate = new Date('2025-10-26T23:59:00-03:00');   // 26 de Outubro de 2025, 23:59 PM

    console.log('📅 Configurando janela de pontuação/edição:');
    console.log('   Início:', roundStartDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    console.log('   Fim:', roundEndDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

    // Buscar competição ativa da liga principal
    let competition = await prisma.competition.findFirst({
      where: {
        leagueId: mainLeague.id,
        status: 'active'
      }
    });

    if (competition) {
      // Atualizar competição existente
      console.log('🔄 Atualizando competição existente...');
      competition = await prisma.competition.update({
        where: { id: competition.id },
        data: {
          startTime: roundStartDate,
          endTime: roundEndDate,
          status: 'active'
        }
      });
      console.log('✅ Competição atualizada:', competition.id);
    } else {
      // Criar nova competição
      console.log('🆕 Criando nova competição...');
      competition = await prisma.competition.create({
        data: {
          leagueId: mainLeague.id,
          startTime: roundStartDate,
          endTime: roundEndDate,
          status: 'active',
          prizePool: mainLeague.totalPrizePool || 0,
          distributed: false
        }
      });
      console.log('✅ Nova competição criada:', competition.id);
    }

    // Verificar se a liga está aberta para novas entradas
    const currentDate = new Date();
    const isLeagueOpen = currentDate >= mainLeague.startDate && currentDate <= mainLeague.endDate;
    
    console.log('📊 Status da liga:');
    console.log('   Liga aberta para entradas:', isLeagueOpen ? 'SIM' : 'NÃO');
    console.log('   Data atual:', currentDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    console.log('   Início da liga:', mainLeague.startDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    console.log('   Fim da liga:', mainLeague.endDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

    // Se a liga não estiver aberta, abrir para novas entradas
    if (!isLeagueOpen) {
      console.log('🔓 Abrindo liga para novas entradas...');
      await prisma.league.update({
        where: { id: mainLeague.id },
        data: {
          startDate: new Date('2025-10-24T00:00:00-03:00'), // Ontem
          endDate: new Date('2025-10-26T23:59:59-03:00'),   // Amanhã
          status: 'ACTIVE'
        }
      });
      console.log('✅ Liga aberta para novas entradas');
    }

    console.log('\n🎉 Janela da Liga Principal atualizada com sucesso!');
    console.log('📋 Resumo:');
    console.log('   • Liga Principal: ABERTA para novas entradas');
    console.log('   • Janela de edição: 25/10/2025 10:00 - 22:00 (Brasília)');
    console.log('   • Status da competição: ATIVA');
    console.log('   • Prêmio total:', mainLeague.totalPrizePool || 0, 'SOL');

  } catch (error) {
    console.error('❌ Erro ao atualizar janela da liga:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLeagueWindow();
