const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUserTeams() {
  console.log('🔍 VERIFICANDO REGISTROS DO USUÁRIO\n');
  console.log('='.repeat(80));

  try {
    // Buscar todos os UserTeams do usuário
    const userTeams = await prisma.userTeam.findMany({
      where: {
        user: {
          name: { contains: 'Sport Club Receba' }
        }
      },
      include: {
        competition: {
          include: {
            league: true
          }
        },
        user: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`\n📊 TOTAL DE REGISTROS: ${userTeams.length}\n`);

    if (userTeams.length === 0) {
      console.log('❌ Nenhum registro encontrado!');
    } else {
      userTeams.forEach((team, index) => {
        const tokens = Array.isArray(team.players) ? team.players : [];

        console.log(`📋 REGISTRO ${index + 1}:`);
        console.log('─'.repeat(80));
        console.log(`   Liga: ${team.competition.league.name}`);
        console.log(`   Liga ID: ${team.competition.league.id}`);
        console.log(`   Competição: ${team.competition.name || 'Sem nome'}`);
        console.log(`   Competição ID: ${team.competition.id}`);
        console.log(`   Status Competição: ${team.competition.status}`);
        console.log(`   Time: ${team.teamName}`);
        console.log(`   Pontos: ${team.totalPoints}`);
        console.log(`   Jogadores (${tokens.length}): ${tokens.join(', ')}`);
        console.log(`   Criado em: ${team.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // Também verificar todas as competições da liga principal
    console.log('='.repeat(80));
    console.log('\n📅 TODAS AS COMPETIÇÕES DA LIGA PRINCIPAL:\n');

    const mainLeague = await prisma.league.findFirst({
      where: {
        name: { contains: 'Principal', mode: 'insensitive' }
      }
    });

    if (mainLeague) {
      const competitions = await prisma.competition.findMany({
        where: { leagueId: mainLeague.id },
        orderBy: { createdAt: 'asc' },
        include: {
          _count: {
            select: { userTeams: true }
          }
        }
      });

      competitions.forEach((comp, index) => {
        console.log(`🏆 RODADA ${index + 1}:`);
        console.log(`   ID: ${comp.id}`);
        console.log(`   Nome: ${comp.name || 'Sem nome'}`);
        console.log(`   Status: ${comp.status}`);
        console.log(`   Times registrados: ${comp._count.userTeams}`);
        console.log(`   Criada em: ${comp.createdAt.toISOString()}`);
        console.log('');
      });
    }

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ ERRO:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyUserTeams();
