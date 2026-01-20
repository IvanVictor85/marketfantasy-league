const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🎯 POPULAR TOKENS DAS RODADAS FUTURAS
 *
 * Este script copia os tokens da Rodada 1 para as Rodadas 2, 3, e 4
 * para permitir que usuários criem times antes da rodada começar.
 */

async function populateUpcomingRoundsTokens() {
  console.log('🚀 Populando tokens das rodadas futuras...\n');

  try {
    // 1. Buscar tokens da Rodada 1 (referência)
    console.log('1️⃣ Buscando tokens da Rodada 1...');

    const round1 = await prisma.competition.findFirst({
      where: {
        name: 'Rodada 1',
        leagueId: 'cmh3qcrw80000cjvdrwtvt65i'
      },
      include: {
        competitionTokens: {
          select: {
            tokenId: true,
            symbol: true,
            name: true
          }
        }
      }
    });

    if (!round1) {
      throw new Error('❌ Rodada 1 não encontrada!');
    }

    console.log(`✅ Rodada 1 encontrada: ${round1.competitionTokens.length} tokens`);
    console.log(`   Tokens: ${round1.competitionTokens.map(t => t.symbol).join(', ')}\n`);

    // 2. Buscar rodadas futuras sem tokens
    console.log('2️⃣ Buscando rodadas futuras...');

    const upcomingRounds = await prisma.competition.findMany({
      where: {
        leagueId: 'cmh3qcrw80000cjvdrwtvt65i',
        name: { in: ['Rodada 2', 'Rodada 3', 'Rodada 4'] },
        status: 'UPCOMING'
      },
      orderBy: { startDate: 'asc' }
    });

    console.log(`✅ Encontradas ${upcomingRounds.length} rodadas futuras:\n`);
    upcomingRounds.forEach(r => {
      console.log(`   - ${r.name} (ID: ${r.id})`);
    });

    // 3. Popular cada rodada com os tokens
    console.log('\n3️⃣ Populando tokens...\n');

    for (const round of upcomingRounds) {
      console.log(`📝 ${round.name}:`);

      // Verificar se já tem tokens
      const existingCount = await prisma.competitionToken.count({
        where: { competitionId: round.id }
      });

      if (existingCount > 0) {
        console.log(`   ⚠️  Já possui ${existingCount} tokens. Pulando...\n`);
        continue;
      }

      // Criar tokens para esta rodada
      let created = 0;
      for (const token of round1.competitionTokens) {
        await prisma.competitionToken.create({
          data: {
            competitionId: round.id,
            tokenId: token.tokenId,
            symbol: token.symbol,
            name: token.name,
            imageUrl: '',
            // Não definir preços ainda - serão definidos pelo snapshot-initial
            priceStart: null,
            priceStartDate: null,
            priceEnd: null,
            priceEndDate: null,
            percentChange: null
          }
        });
        created++;
      }

      console.log(`   ✅ ${created} tokens criados!\n`);
    }

    // 4. Verificação final
    console.log('4️⃣ Verificação final:\n');

    for (const round of upcomingRounds) {
      const count = await prisma.competitionToken.count({
        where: { competitionId: round.id }
      });
      console.log(`   ${round.name}: ${count} tokens`);
    }

    console.log('\n✅ Concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateUpcomingRoundsTokens();
