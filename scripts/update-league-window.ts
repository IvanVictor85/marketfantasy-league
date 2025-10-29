import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLeagueWindow() {
  try {
    console.log('🕐 Atualizando janela da rodada...');

    // Encontrar a Liga Principal
    const mainLeague = await prisma.league.findFirst({
      where: {
        name: {
          contains: 'Principal',
          mode: 'insensitive'
        }
      },
      include: {
        competitions: true
      }
    });

    if (!mainLeague) {
      console.error('❌ Liga Principal não encontrada');
      return;
    }

    console.log('✅ Liga Principal encontrada:', {
      id: mainLeague.id,
      name: mainLeague.name,
      competitionsCount: mainLeague.competitions.length
    });

    // Definir nova janela: domingo (02/11/2025) às 21:00 até sexta (07/11/2025) às 21:00
    const tomorrow = new Date('2025-11-02T21:00:00-03:00'); // Início: 02/11/2025 21:00 (Brasília - Domingo)
    const tomorrowEnd = new Date('2025-11-07T21:00:00-03:00'); // Fim: 07/11/2025 21:00 (Brasília - Sexta)

    console.log('📅 Nova janela definida:', {
      início: tomorrow.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      fim: tomorrowEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    });

    // Buscar competição ativa ou criar nova
    let activeCompetition = mainLeague.competitions.find(comp => comp.status === 'active');
    
    if (activeCompetition) {
      // Atualizar competição existente
      const updatedCompetition = await prisma.competition.update({
        where: {
          id: activeCompetition.id
        },
        data: {
          startTime: tomorrow,
          endTime: tomorrowEnd,
          status: 'active'
        }
      });

      console.log('✅ Competição atualizada:', {
        id: updatedCompetition.id,
        startTime: updatedCompetition.startTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        endTime: updatedCompetition.endTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        status: updatedCompetition.status
      });
    } else {
      // Criar nova competição
      const newCompetition = await prisma.competition.create({
        data: {
          leagueId: mainLeague.id,
          startTime: tomorrow,
          endTime: tomorrowEnd,
          status: 'active',
          prizePool: 1000,
          distributed: false
        }
      });

      console.log('✅ Nova competição criada:', {
        id: newCompetition.id,
        leagueId: newCompetition.leagueId,
        startTime: newCompetition.startTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        endTime: newCompetition.endTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        status: newCompetition.status
      });
    }

    console.log('🎉 Janela da rodada atualizada com sucesso!');
    console.log('📝 Rodada em andamento: domingo 21:00 até sexta 21:00 (horário de Brasília) - 5 dias');

  } catch (error) {
    console.error('❌ Erro ao atualizar janela da rodada:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLeagueWindow();