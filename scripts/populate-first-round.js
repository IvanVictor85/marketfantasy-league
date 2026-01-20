const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🎯 SCRIPT PARA POPULAR PRIMEIRA RODADA
 *
 * Este script pega todos os usuários que têm time template (mainTeam)
 * e cria uma entrada UserTeam para eles na primeira rodada da liga principal.
 */

async function populateFirstRound() {
  console.log('🎯 INICIANDO POPULAÇÃO DA PRIMEIRA RODADA\n');
  console.log('='.repeat(60));

  try {
    // 1️⃣ BUSCAR LIGA PRINCIPAL
    console.log('\n1️⃣ Buscando liga principal...');

    const mainLeague = await prisma.league.findFirst({
      where: {
        name: {
          contains: 'Principal',
          mode: 'insensitive'
        }
      }
    });

    if (!mainLeague) {
      console.log('❌ Liga principal não encontrada!');
      console.log('💡 Dica: Certifique-se de que existe uma liga com "Principal" no nome.');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Liga encontrada: ${mainLeague.name} (${mainLeague.id})`);

    // 2️⃣ BUSCAR PRIMEIRA COMPETIÇÃO DA LIGA
    console.log('\n2️⃣ Buscando primeira competição da liga...');

    const firstCompetition = await prisma.competition.findFirst({
      where: {
        leagueId: mainLeague.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (!firstCompetition) {
      console.log('❌ Nenhuma competição encontrada para esta liga!');
      console.log('💡 Dica: Crie uma competição para a liga principal primeiro.');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Primeira competição: ${firstCompetition.name || firstCompetition.id}`);
    console.log(`   Status: ${firstCompetition.status}`);
    console.log(`   ID: ${firstCompetition.id}`);

    // 3️⃣ BUSCAR TODOS OS USUÁRIOS COM mainTeam
    console.log('\n3️⃣ Buscando usuários com time template...');

    const usersWithTeam = await prisma.user.findMany({
      where: {
        mainTeam: {
          not: null
        }
      }
    });

    console.log(`✅ Encontrados ${usersWithTeam.length} usuários com time template\n`);

    if (usersWithTeam.length === 0) {
      console.log('⚠️ Nenhum usuário com time template encontrado!');
      await prisma.$disconnect();
      return;
    }

    // 4️⃣ CRIAR UserTeam PARA CADA USUÁRIO
    console.log('4️⃣ Criando entradas UserTeam...\n');
    console.log('─'.repeat(60));

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of usersWithTeam) {
      try {
        // Verificar se já existe entrada para este usuário nesta competição
        const existingEntry = await prisma.userTeam.findUnique({
          where: {
            userId_competitionId: {
              userId: user.id,
              competitionId: firstCompetition.id
            }
          }
        });

        if (existingEntry) {
          console.log(`⏭️  ${user.name || user.email} - Já possui entrada (pulando)`);
          skippedCount++;
          continue;
        }

        // Obter os tokens do mainTeam
        const mainTeam = user.mainTeam;
        let tokens = [];

        if (Array.isArray(mainTeam)) {
          tokens = mainTeam;
        } else if (typeof mainTeam === 'object' && mainTeam !== null) {
          // Se for um objeto, tentar extrair array de tokens
          tokens = mainTeam.tokens || mainTeam.players || [];
        }

        if (tokens.length === 0) {
          console.log(`⚠️  ${user.name || user.email} - mainTeam vazio (pulando)`);
          skippedCount++;
          continue;
        }

        // Criar UserTeam
        const userTeam = await prisma.userTeam.create({
          data: {
            userId: user.id,
            competitionId: firstCompetition.id,
            players: tokens,
            teamName: user.name || `Time de ${user.email}`,
            totalPoints: 0
          }
        });

        console.log(`✅ ${user.name || user.email} - Entrada criada com ${tokens.length} jogadores`);
        console.log(`   Jogadores: ${tokens.join(', ')}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ ${user.name || user.email} - Erro: ${error.message}`);
        errorCount++;
      }
    }

    // 5️⃣ RESUMO FINAL
    console.log('\n' + '─'.repeat(60));
    console.log('📊 RESUMO DA OPERAÇÃO:');
    console.log('─'.repeat(60));
    console.log(`✅ Entradas criadas: ${createdCount}`);
    console.log(`⏭️  Entradas já existentes (puladas): ${skippedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total de usuários processados: ${usersWithTeam.length}`);
    console.log('='.repeat(60));

    if (createdCount > 0) {
      console.log('\n🎉 População da primeira rodada concluída com sucesso!');
      console.log(`   ${createdCount} usuários agora estão participando da competição.`);
    } else {
      console.log('\n⚠️ Nenhuma nova entrada foi criada.');
    }

    await prisma.$disconnect();

  } catch (error) {
    console.error('\n❌ ERRO NA OPERAÇÃO:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Executar script
populateFirstRound();
