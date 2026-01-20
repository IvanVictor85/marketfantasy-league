const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateToUserTeam() {
  console.log('🔄 Migrando dados de Team (legacy) → UserTeam...\n');

  try {
    // 1. Buscar todos os times legados
    const legacyTeams = await prisma.team.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Times legacy encontrados: ${legacyTeams.length}\n`);

    if (legacyTeams.length === 0) {
      console.log('✅ Nenhum time legacy para migrar!');
      await prisma.$disconnect();
      return;
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const team of legacyTeams) {
      console.log(`\n🔍 Processando time de ${team.user.name} (${team.user.email})...`);
      console.log(`   LeagueId: ${team.leagueId}`);

      try {
        // 2. Encontrar a competição ACTIVE da liga
        let competition = await prisma.competition.findFirst({
          where: {
            leagueId: team.leagueId,
            status: 'ACTIVE'
          },
          orderBy: {
            startDate: 'desc'
          }
        });

        // Se não houver ACTIVE, pegar a mais recente
        if (!competition) {
          console.log('   ⚠️ Nenhuma competição ACTIVE, buscando mais recente...');
          competition = await prisma.competition.findFirst({
            where: {
              leagueId: team.leagueId
            },
            orderBy: {
              startDate: 'desc'
            }
          });
        }

        if (!competition) {
          console.log('   ❌ Nenhuma competição encontrada para esta liga. Pulando...');
          skipped++;
          continue;
        }

        console.log(`   ✅ Competição: ${competition.id} (${competition.status})`);

        // 3. Parse dos tokens
        let players;
        try {
          players = JSON.parse(team.tokens);
        } catch (e) {
          console.log('   ❌ Erro ao fazer parse dos tokens. Pulando...');
          skipped++;
          continue;
        }

        if (!Array.isArray(players) || players.length === 0) {
          console.log('   ⚠️ Time vazio. Pulando...');
          skipped++;
          continue;
        }

        console.log(`   📋 Tokens: ${players.join(', ')}`);

        // 4. Verificar se já existe em UserTeam
        const existing = await prisma.userTeam.findUnique({
          where: {
            userId_competitionId: {
              userId: team.userId,
              competitionId: competition.id
            }
          }
        });

        if (existing) {
          console.log('   ⚠️ Já existe em UserTeam. Atualizando...');

          await prisma.userTeam.update({
            where: {
              userId_competitionId: {
                userId: team.userId,
                competitionId: competition.id
              }
            },
            data: {
              players: players,
              totalPoints: team.totalScore || 0,
              teamName: team.teamName,
              updatedAt: new Date()
            }
          });

          console.log('   ✅ UserTeam atualizado!');
        } else {
          // 5. Criar novo UserTeam
          await prisma.userTeam.create({
            data: {
              userId: team.userId,
              competitionId: competition.id,
              players: players,
              totalPoints: team.totalScore || 0,
              teamName: team.teamName
            }
          });

          console.log('   ✅ UserTeam criado!');
        }

        migrated++;

      } catch (error) {
        console.error(`   ❌ Erro ao migrar: ${error.message}`);
        errors++;
      }
    }

    // 6. Resumo final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTADO DA MIGRAÇÃO:');
    console.log('='.repeat(50));
    console.log(`   ✅ Migrados: ${migrated}`);
    console.log(`   ⚠️ Pulados: ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`   📊 Total processado: ${legacyTeams.length}`);

    // 7. Verificar UserTeams criados
    const userTeamsCount = await prisma.userTeam.count();
    console.log(`\n📈 Total de UserTeams no banco: ${userTeamsCount}`);

    console.log('\n✅ Migração concluída!');

    await prisma.$disconnect();

  } catch (error) {
    console.error('\n❌ Erro fatal na migração:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

migrateToUserTeam();
