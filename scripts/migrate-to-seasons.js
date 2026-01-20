/**
 * Script de Migração: Arquitetura Antiga → Nova Arquitetura de Temporadas
 *
 * Este script migra os dados existentes para a nova arquitetura de 3 níveis:
 * - Season (Temporada)
 * - League (Liga - tipo/regras)
 * - Competition (Rodada - instância de tempo)
 * - UserTeam (Time snapshot por rodada)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migração para arquitetura de Temporadas...\n');

  try {
    // ============================================
    // PASSO 1: Criar Temporada Padrão
    // ============================================
    console.log('📅 Criando Temporada 1...');

    const season = await prisma.season.upsert({
      where: { id: 'season-1-2025' },
      update: {},
      create: {
        id: 'season-1-2025',
        name: 'Temporada 1 - 2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        status: 'ACTIVE',
        prizePool: 0,
      },
    });

    console.log(`✅ Temporada criada: ${season.name}\n`);

    // ============================================
    // PASSO 2: Criar Ligas (transformar dados antigos)
    // ============================================
    console.log('🏆 Migrando Ligas antigas...');

    // Buscar ligas antigas (tabela 'leagues')
    const oldLeagues = await prisma.$queryRaw`
      SELECT * FROM leagues WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leagues')
    `.catch(() => []);

    const newLeagues = [];

    if (oldLeagues.length > 0) {
      for (const oldLeague of oldLeagues) {
        console.log(`  → Migrando liga: ${oldLeague.name}`);

        const newLeague = await prisma.league.upsert({
          where: { id: oldLeague.id },
          update: {},
          create: {
            id: oldLeague.id,
            name: oldLeague.name,
            description: oldLeague.description,
            entryFee: oldLeague.entryFee || 10,
            emblemUrl: oldLeague.emblemUrl,
            badgeUrl: oldLeague.badgeUrl,
            bannerUrl: oldLeague.bannerUrl,
          },
        });

        newLeagues.push(newLeague);
      }
    } else {
      // Criar Liga Principal padrão
      console.log('  → Criando Liga Principal padrão...');
      const mainLeague = await prisma.league.upsert({
        where: { id: 'main-league' },
        update: {},
        create: {
          id: 'main-league',
          name: 'Liga Principal',
          description: 'Liga Principal do MFL - Todos os tokens permitidos',
          entryFee: 10,
        },
      });

      newLeagues.push(mainLeague);
    }

    console.log(`✅ ${newLeagues.length} liga(s) migrada(s)\n`);

    // ============================================
    // PASSO 3: Migrar Competições antigas
    // ============================================
    console.log('⚡ Migrando Competições antigas...');

    const oldCompetitions = await prisma.$queryRaw`
      SELECT * FROM competitions WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitions' AND column_name = 'startTime')
    `.catch(() => []);

    const newCompetitions = [];

    if (oldCompetitions.length > 0) {
      for (const oldComp of oldCompetitions) {
        console.log(`  → Migrando competição: ${oldComp.id}`);

        // Encontrar ou usar a primeira liga
        const leagueId = oldComp.leagueId || newLeagues[0].id;

        const newComp = await prisma.competition.upsert({
          where: { id: oldComp.id },
          update: {},
          create: {
            id: oldComp.id,
            name: `Rodada ${new Date(oldComp.startTime).toLocaleDateString('pt-BR')}`,
            startDate: new Date(oldComp.startTime),
            endDate: new Date(oldComp.endTime),
            status: oldComp.status,
            prizePool: oldComp.prizePool || 0,
            distributed: oldComp.distributed || false,
            leagueId: leagueId,
            seasonId: season.id,
          },
        });

        newCompetitions.push(newComp);
      }
    } else {
      // Criar competição padrão para a liga principal
      console.log('  → Criando Rodada 1 padrão...');

      const now = new Date();
      const startDate = new Date(now);
      startDate.setHours(21, 0, 0, 0); // Dom 21:00

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5); // Sex 21:00 (5 dias depois)

      const defaultComp = await prisma.competition.upsert({
        where: { id: 'round-1-2025' },
        update: {},
        create: {
          id: 'round-1-2025',
          name: 'Rodada 1',
          startDate,
          endDate,
          status: 'ACTIVE',
          prizePool: 0,
          leagueId: newLeagues[0].id,
          seasonId: season.id,
        },
      });

      newCompetitions.push(defaultComp);
    }

    console.log(`✅ ${newCompetitions.length} competição(ões) migrada(s)\n`);

    // ============================================
    // PASSO 4: Migrar Times → UserTeams
    // ============================================
    console.log('👥 Migrando Times para UserTeams (snapshots)...');

    const oldTeams = await prisma.$queryRaw`
      SELECT * FROM teams WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams')
    `.catch(() => []);

    let migratedTeams = 0;

    if (oldTeams.length > 0 && newCompetitions.length > 0) {
      const defaultCompetition = newCompetitions[0];

      for (const oldTeam of oldTeams) {
        try {
          // Parsear tokens do formato antigo (string JSON)
          const players = JSON.parse(oldTeam.tokens);

          await prisma.userTeam.upsert({
            where: {
              userId_competitionId: {
                userId: oldTeam.userId,
                competitionId: defaultCompetition.id,
              },
            },
            update: {},
            create: {
              userId: oldTeam.userId,
              competitionId: defaultCompetition.id,
              players: players, // Array de símbolos
              totalPoints: oldTeam.totalScore || 0,
              teamName: oldTeam.teamName,
              selectedMascotUrl: oldTeam.selectedMascotUrl,
            },
          });

          migratedTeams++;
        } catch (error) {
          console.error(`  ⚠️  Erro ao migrar time ${oldTeam.id}:`, error.message);
        }
      }
    }

    console.log(`✅ ${migratedTeams} time(s) migrado(s) para UserTeams\n`);

    // ============================================
    // PASSO 5: Atualizar campo mainTeam dos usuários
    // ============================================
    console.log('🔧 Atualizando campo mainTeam dos usuários...');

    const users = await prisma.user.findMany({
      include: {
        legacyTeams: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    let updatedUsers = 0;

    for (const user of users) {
      if (user.legacyTeams.length > 0) {
        const latestTeam = user.legacyTeams[0];

        try {
          const players = JSON.parse(latestTeam.tokens);

          await prisma.user.update({
            where: { id: user.id },
            data: { mainTeam: players },
          });

          updatedUsers++;
        } catch (error) {
          console.error(`  ⚠️  Erro ao atualizar usuário ${user.id}:`, error.message);
        }
      }
    }

    console.log(`✅ ${updatedUsers} usuário(s) atualizado(s) com mainTeam\n`);

    // ============================================
    // RESUMO
    // ============================================
    console.log('✨ Migração concluída com sucesso!\n');
    console.log('📊 Resumo:');
    console.log(`  • Temporadas: 1`);
    console.log(`  • Ligas: ${newLeagues.length}`);
    console.log(`  • Competições: ${newCompetitions.length}`);
    console.log(`  • Times migrados: ${migratedTeams}`);
    console.log(`  • Usuários atualizados: ${updatedUsers}\n`);

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
