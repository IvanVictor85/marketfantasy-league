const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🎯 SCRIPT DE CRIAÇÃO DE TEMPORADA
 *
 * Cria uma temporada completa com todas as rodadas pré-configuradas.
 * Permite ajustar facilmente para testes ou produção.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 CONFIGURAÇÃO DA TEMPORADA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CONFIG = {
  // 🏆 Dados da Temporada
  seasonName: 'Temporada 1 - Testes',

  // 📅 Data de INÍCIO da primeira rodada (Domingo 21h BR = Segunda 00h UTC)
  // Formato: 'YYYY-MM-DD' (será ajustado para 00h UTC = 21h BR do dia anterior)
  firstRoundStart: '2025-01-27', // Segunda 00h UTC = Domingo 26/01 21h BR

  // 🔢 Número de rodadas
  numRounds: 4,

  // ⏱️ DURAÇÃO DE CADA RODADA (em dias)
  // Produção: 7 dias (Dom 21h → Sex 21h)
  // Teste: 2 dias (permite testar rápido)
  roundDurationDays: 2,

  // 💰 Taxa de entrada (em SOL)
  entryFee: 0.025,

  // 📊 Distribuição de prêmios
  distribution: {
    round: 70,      // 70% para o prêmio da rodada
    season: 18,     // 18% acumula para o prêmio da temporada
    maintenance: 12 // 12% para manutenção
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 FUNÇÕES AUXILIARES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function parseDate(dateString) {
  // Converte 'YYYY-MM-DD' para Date em UTC 00:00
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function formatBRTime(date) {
  // Mostra horário de Brasília (UTC-3)
  const brDate = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return brDate.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 SCRIPT PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function createSeason() {
  console.log('🎬 CRIANDO TEMPORADA DE TESTES\n');
  console.log('='.repeat(80));

  try {
    // 1️⃣ BUSCAR LIGA PRINCIPAL
    console.log('\n1️⃣ Buscando liga principal...');

    const mainLeague = await prisma.league.findFirst({
      where: {
        name: { contains: 'Principal', mode: 'insensitive' }
      }
    });

    if (!mainLeague) {
      throw new Error('❌ Liga principal não encontrada!');
    }

    console.log(`✅ Liga encontrada: ${mainLeague.name} (${mainLeague.id})`);

    // 2️⃣ VERIFICAR SE JÁ EXISTE TEMPORADA ATIVA
    console.log('\n2️⃣ Verificando temporadas existentes...');

    const existingSeason = await prisma.season.findFirst({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'UPCOMING' }
        ]
      }
    });

    if (existingSeason) {
      console.log('⚠️  Temporada ativa encontrada:', existingSeason.name);
      console.log('❌ Cancele a temporada existente antes de criar uma nova.');
      console.log('   Use: node scripts/cancel-season.js');
      await prisma.$disconnect();
      return;
    }

    // 3️⃣ CALCULAR DATAS
    console.log('\n3️⃣ Calculando datas das rodadas...');

    const firstRoundStartDate = parseDate(CONFIG.firstRoundStart);
    const lastRoundEndDate = new Date(firstRoundStartDate);
    lastRoundEndDate.setUTCDate(
      lastRoundEndDate.getUTCDate() +
      (CONFIG.numRounds * CONFIG.roundDurationDays)
    );

    console.log(`   Início: ${formatBRTime(firstRoundStartDate)}`);
    console.log(`   Fim: ${formatBRTime(lastRoundEndDate)}`);
    console.log(`   Duração: ${CONFIG.numRounds} rodadas x ${CONFIG.roundDurationDays} dias = ${CONFIG.numRounds * CONFIG.roundDurationDays} dias`);

    // 4️⃣ CRIAR TEMPORADA
    console.log('\n4️⃣ Criando temporada...');

    const season = await prisma.season.create({
      data: {
        name: CONFIG.seasonName,
        startDate: firstRoundStartDate,
        endDate: lastRoundEndDate,
        status: 'ACTIVE',
        prizePool: 0 // Vai acumulando 18% de cada entrada
      }
    });

    console.log(`✅ Temporada criada: ${season.name}`);
    console.log(`   ID: ${season.id}`);

    // 5️⃣ CRIAR RODADAS
    console.log('\n5️⃣ Criando rodadas...\n');

    const rounds = [];

    for (let i = 0; i < CONFIG.numRounds; i++) {
      // Calcular datas desta rodada
      const roundStartDate = new Date(firstRoundStartDate);
      roundStartDate.setUTCDate(roundStartDate.getUTCDate() + (i * CONFIG.roundDurationDays));

      const roundEndDate = new Date(roundStartDate);
      roundEndDate.setUTCDate(roundEndDate.getUTCDate() + CONFIG.roundDurationDays);

      // Determinar status
      // - Primeira rodada: PENDING (aceita pagamentos e edição)
      // - Demais: UPCOMING (aguardando liberação)
      const status = i === 0 ? 'PENDING' : 'UPCOMING';

      const round = await prisma.competition.create({
        data: {
          name: `Rodada ${i + 1}`,
          seasonId: season.id,
          leagueId: mainLeague.id,
          startDate: roundStartDate,
          endDate: roundEndDate,
          status: status,
          prizePool: 0, // Vai acumulando 70% das entradas
          distributed: false
        }
      });

      rounds.push(round);

      console.log(`   ${status === 'PENDING' ? '🟢' : '⚪'} Rodada ${i + 1}:`);
      console.log(`      ID: ${round.id}`);
      console.log(`      Início: ${formatBRTime(roundStartDate)}`);
      console.log(`      Fim: ${formatBRTime(roundEndDate)}`);
      console.log(`      Status: ${status}`);
      console.log(`      ${status === 'PENDING' ? '✅ Aceita pagamentos e edição' : '⏳ Aguardando liberação'}`);
      console.log();
    }

    // 6️⃣ RESUMO FINAL
    console.log('='.repeat(80));
    console.log('✅ TEMPORADA CRIADA COM SUCESSO!\n');
    console.log('📊 RESUMO:');
    console.log('='.repeat(80));
    console.log(`Temporada: ${season.name}`);
    console.log(`ID: ${season.id}`);
    console.log(`Rodadas: ${rounds.length}`);
    console.log(`Duração de cada rodada: ${CONFIG.roundDurationDays} dias`);
    console.log(`Taxa de entrada: ${CONFIG.entryFee} SOL`);
    console.log(`Distribuição: ${CONFIG.distribution.round}% rodada | ${CONFIG.distribution.season}% temporada | ${CONFIG.distribution.maintenance}% manutenção`);
    console.log();
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Rodada 1 está PENDING (aceita pagamentos)');
    console.log('   2. Usuários podem pagar e criar times');
    console.log(`   3. No dia ${formatBRTime(rounds[0].startDate)}, rode:`);
    console.log('      → node scripts/snapshot-initial.js');
    console.log(`   4. No dia ${formatBRTime(rounds[0].endDate)}, rode:`);
    console.log('      → node scripts/snapshot-final.js');
    console.log('   5. O snapshot-final automaticamente libera a Rodada 2');
    console.log();
    console.log('📅 CALENDÁRIO COMPLETO:');
    console.log('='.repeat(80));

    rounds.forEach((round, index) => {
      console.log(`${index + 1}. ${round.name}`);
      console.log(`   Início: ${formatBRTime(round.startDate)} (snapshot inicial)`);
      console.log(`   Fim: ${formatBRTime(round.endDate)} (snapshot final)`);
      console.log(`   Status: ${round.status}`);
      console.log();
    });

    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERRO:', error);
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.$disconnect();
}

// Executar script
createSeason();
