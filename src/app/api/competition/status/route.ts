import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('🏆 [COMPETITION-STATUS] === INÍCIO DA REQUISIÇÃO ===');
  
  try {
    console.log('🏆 [COMPETITION-STATUS] 1. Parsing da URL...');
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('id');
    console.log('🏆 [COMPETITION-STATUS] 2. CompetitionId extraído:', competitionId);

    if (!competitionId) {
      console.log('❌ [COMPETITION-STATUS] 3. ERRO: ID da competição é obrigatório');
      return NextResponse.json(
        { error: 'ID da competição é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🏆 [COMPETITION-STATUS] 4. Iniciando busca no Prisma...');
    
    // Buscar a liga/competição
    let league;
    
    if (competitionId === 'main-league') {
      console.log('🏆 [COMPETITION-STATUS] 5. Buscando Liga Principal...');
      league = await prisma.league.findFirst({
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
      console.log('🏆 [COMPETITION-STATUS] 6. Liga Principal encontrada:', !!league);
    } else {
      console.log('🏆 [COMPETITION-STATUS] 5. Buscando liga por ID:', competitionId);
      league = await prisma.league.findUnique({
        where: {
          id: competitionId
        },
        include: {
          competitions: true
        }
      });
      console.log('🏆 [COMPETITION-STATUS] 6. Liga por ID encontrada:', !!league);
    }

    if (!league) {
      console.log('❌ [COMPETITION-STATUS] 7. ERRO: Liga não encontrada:', competitionId);
      return NextResponse.json(
        { error: 'Liga não encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ [COMPETITION-STATUS] 8. Liga encontrada:', {
      id: league.id,
      name: league.name,
      competitionsCount: league.competitions.length
    });

    console.log('🏆 [COMPETITION-STATUS] 9. Buscando competição ativa...');
    // Buscar competição ativa ou usar a primeira disponível
    let activeCompetition = league.competitions.find(comp => comp.status === 'active');
    if (!activeCompetition && league.competitions.length > 0) {
      activeCompetition = league.competitions[0]; // Usar a primeira se não houver ativa
    }
    console.log('🏆 [COMPETITION-STATUS] 10. Competição ativa encontrada:', !!activeCompetition);

    // Se não há dados de competição, criar dados padrão
    if (!activeCompetition) {
      console.log('📊 [COMPETITION-STATUS] 11. Criando dados padrão...');
      const defaultCompetition = {
        id: `comp-${league.id}`,
        leagueId: league.id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas no futuro
        status: 'active' as const,
        prizePool: 1000,
        distributed: false
      };

      console.log('📊 [COMPETITION-STATUS] 12. Retornando dados padrão:', defaultCompetition);
      
      return NextResponse.json({
        competition: defaultCompetition,
        rankings: [],
        winners: [],
        totalParticipants: 0,
        loading: false,
        error: null
      });
    }

    console.log('🏆 [COMPETITION-STATUS] 13. Contando times da liga...');
    // Buscar times da liga para calcular participantes
    const teamCount = await prisma.team.count({
      where: {
        leagueId: league.id
      }
    });
    console.log('🏆 [COMPETITION-STATUS] 14. Times encontrados:', teamCount);

    console.log('🏆 [COMPETITION-STATUS] 15. Montando resposta final...');
    const competitionData = {
      competition: {
        id: activeCompetition.id,
        leagueId: activeCompetition.leagueId,
        startTime: activeCompetition.startTime,
        endTime: activeCompetition.endTime,
        status: activeCompetition.status,
        prizePool: activeCompetition.prizePool,
        distributed: activeCompetition.distributed
      },
      rankings: [],
      winners: [],
      totalParticipants: teamCount,
      loading: false,
      error: null
    };

    console.log('✅ [COMPETITION-STATUS] 16. Dados finais:', {
      competitionId: competitionData.competition.id,
      startTime: competitionData.competition.startTime,
      endTime: competitionData.competition.endTime,
      participants: competitionData.totalParticipants
    });

    console.log('🏆 [COMPETITION-STATUS] 17. Retornando resposta 200...');
    return NextResponse.json(competitionData);

  } catch (error) {
    console.error('❌ [COMPETITION-STATUS] === ERRO CAPTURADO ===');
    console.error('❌ [COMPETITION-STATUS] Tipo do erro:', typeof error);
    console.error('❌ [COMPETITION-STATUS] Mensagem:', error instanceof Error ? error.message : String(error));
    console.error('❌ [COMPETITION-STATUS] Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('❌ [COMPETITION-STATUS] Erro completo:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}