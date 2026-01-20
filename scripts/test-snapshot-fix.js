/**
 * 🧪 TESTE DA CORREÇÃO DO SNAPSHOT
 *
 * Simula o cenário do bug:
 * 1. Cria uma competição de teste
 * 2. Adiciona apenas Top 100 tokens (sem DASH)
 * 3. Cria um time com DASH
 * 4. Executa snapshot inicial
 * 5. Verifica se DASH foi criado automaticamente
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSnapshotFix() {
  console.log('\n🧪 TESTE DA CORREÇÃO DO SNAPSHOT\n');
  console.log('='.repeat(80));

  const testCompId = 'test_snapshot_fix_' + Date.now();
  const testUserId = 'test_user_' + Date.now();

  try {
    // 1. Criar usuário de teste
    console.log('\n📝 1. Criando usuário de teste...\n');

    const testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test_${Date.now()}@test.com`,
        name: 'Test User',
        username: 'Test User'
      }
    });

    console.log(`✅ Usuário criado: ${testUser.email}`);

    // 2. Criar competição de teste
    console.log('\n📝 2. Criando competição de teste...\n');

    const testComp = await prisma.competition.create({
      data: {
        id: testCompId,
        leagueId: 'cmicalhzs00001bou8yacqjhc', // Liga principal
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        prizePool: 0,
        distributed: false
      }
    });

    console.log(`✅ Competição criada: ${testComp.id}`);

    // 3. Adicionar apenas BTC, ETH, SOL (simulando Top 100 sem DASH)
    console.log('\n📝 3. Adicionando tokens ao cardápio (sem DASH)...\n');

    await prisma.competitionToken.createMany({
      data: [
        {
          competitionId: testCompId,
          tokenId: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          imageUrl: 'https://example.com/btc.png',
          marketCapRank: 1
        },
        {
          competitionId: testCompId,
          tokenId: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          imageUrl: 'https://example.com/eth.png',
          marketCapRank: 2
        },
        {
          competitionId: testCompId,
          tokenId: 'solana',
          symbol: 'SOL',
          name: 'Solana',
          imageUrl: 'https://example.com/sol.png',
          marketCapRank: 3
        }
      ]
    });

    console.log('✅ 3 tokens adicionados ao cardápio (BTC, ETH, SOL)');

    // 4. Criar time com DASH (token fora do cardápio)
    console.log('\n📝 4. Criando time com DASH escalado...\n');

    const testTeam = await prisma.userTeam.create({
      data: {
        userId: testUserId,
        competitionId: testCompId,
        teamName: 'Test Team',
        players: ['BTC', 'ETH', 'SOL', 'DASH'], // ⚠️ DASH não está no cardápio!
        totalPoints: 0
      }
    });

    console.log(`✅ Time criado com 4 tokens: ${testTeam.players.join(', ')}`);

    // 5. Verificar estado ANTES do snapshot
    console.log('\n📝 5. Estado ANTES do snapshot:\n');

    const tokensBefore = await prisma.competitionToken.findMany({
      where: { competitionId: testCompId },
      select: { symbol: true, priceStart: true }
    });

    console.log(`Tokens no cardápio: ${tokensBefore.length}`);
    tokensBefore.forEach(t => {
      console.log(`   - ${t.symbol}: priceStart = ${t.priceStart || 'null'}`);
    });

    const dashBefore = tokensBefore.find(t => t.symbol === 'DASH');
    if (dashBefore) {
      console.log('\n⚠️  DASH já existe! (não deveria)');
    } else {
      console.log('\n✅ DASH não existe no cardápio (esperado)');
    }

    // 6. Executar snapshot inicial (chamando a API)
    console.log('\n📝 6. Executando snapshot inicial...\n');

    const response = await fetch('http://localhost:3000/api/competition/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitionId: testCompId,
        skipTimeValidation: true
      })
    });

    const result = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));

    // 7. Verificar estado DEPOIS do snapshot
    console.log('\n📝 7. Estado DEPOIS do snapshot:\n');

    const tokensAfter = await prisma.competitionToken.findMany({
      where: { competitionId: testCompId },
      select: { symbol: true, priceStart: true, tokenId: true }
    });

    console.log(`Tokens no cardápio: ${tokensAfter.length}`);
    tokensAfter.forEach(t => {
      console.log(`   - ${t.symbol} (${t.tokenId}): priceStart = ${t.priceStart || 'null'}`);
    });

    const dashAfter = tokensAfter.find(t => t.symbol.toUpperCase() === 'DASH');

    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 RESULTADO DO TESTE:\n');

    if (dashAfter && dashAfter.priceStart) {
      console.log('✅ SUCESSO! DASH foi criado automaticamente pelo snapshot!');
      console.log(`   Symbol: ${dashAfter.symbol}`);
      console.log(`   TokenId: ${dashAfter.tokenId}`);
      console.log(`   Price Start: $${dashAfter.priceStart}`);
      console.log('\n🎉 A correção está funcionando corretamente!\n');
    } else if (dashAfter && !dashAfter.priceStart) {
      console.log('⚠️  PARCIAL: DASH foi criado mas sem priceStart!');
    } else {
      console.log('❌ FALHOU: DASH não foi criado automaticamente!');
      console.log('   O bug ainda existe.\n');
    }

  } catch (error) {
    console.error('\n❌ Erro no teste:', error);
  } finally {
    // Limpar dados de teste
    console.log('\n📝 Limpando dados de teste...\n');

    try {
      await prisma.userTeam.deleteMany({
        where: { competitionId: testCompId }
      });

      await prisma.competitionToken.deleteMany({
        where: { competitionId: testCompId }
      });

      await prisma.competition.delete({
        where: { id: testCompId }
      });

      await prisma.user.delete({
        where: { id: testUserId }
      });

      console.log('✅ Dados de teste removidos');
    } catch (cleanupError) {
      console.error('⚠️  Erro ao limpar:', cleanupError.message);
    }

    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Teste concluído!\n');
}

testSnapshotFix();
