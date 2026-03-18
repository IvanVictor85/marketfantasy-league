/**
 * Script para reiniciar todas as rodadas da Season Alpha
 *
 * Ciclo:
 * - Rodada começa: Segunda 00:00 UTC (Domingo 21h BRT)
 * - Rodada termina: Sábado 00:00 UTC (Sexta 21h BRT)
 * - Duração: 5 dias de competição
 * - Escalação: Aberta desde criação (status PENDING)
 *
 * Uso: node scripts/reiniciar-rodadas.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Reiniciando Rodadas da Season Alpha ===\n');

  // 1. Buscar a Season Alpha
  const season = await prisma.season.findFirst({
    where: { name: { contains: 'Alpha' } }
  });

  if (!season) {
    console.error('❌ Season Alpha não encontrada!');
    return;
  }

  console.log(`📅 Season: ${season.name} (${season.id})`);

  // Buscar a Liga Principal (ou primeira liga disponível)
  const league = await prisma.league.findFirst({
    where: { name: { contains: 'Principal' } }
  }) || await prisma.league.findFirst();

  if (!league) {
    console.error('❌ Nenhuma liga encontrada!');
    return;
  }

  const leagueId = league.id;
  console.log(`   Liga: ${league.name} (${leagueId})\n`);

  // 2. Apagar dados relacionados às rodadas antigas
  console.log('🗑️ Removendo dados antigos...');

  // Buscar competições da season
  const oldCompetitions = await prisma.competition.findMany({
    where: { seasonId: season.id },
    select: { id: true }
  });
  const oldCompIds = oldCompetitions.map(c => c.id);

  // Apagar UserTeam (times) - players é JSON, não relação
  const deletedTeams = await prisma.userTeam.deleteMany({
    where: {
      competitionId: { in: oldCompIds }
    }
  });
  console.log(`   - UserTeam: ${deletedTeams.count} removidos`);

  // Apagar CompetitionToken (tokens disponíveis)
  const deletedTokens = await prisma.competitionToken.deleteMany({
    where: {
      competitionId: { in: oldCompIds }
    }
  });
  console.log(`   - CompetitionToken: ${deletedTokens.count} removidos`);

  // Apagar Competition (rodadas)
  const deletedComps = await prisma.competition.deleteMany({
    where: {
      seasonId: season.id
    }
  });
  console.log(`   - Competition: ${deletedComps.count} removidas`);

  // 3. Calcular datas das novas rodadas
  // Próxima segunda 00:00 UTC = Domingo 21h BRT
  const now = new Date();
  const today = now.getUTCDay(); // 0 = domingo, 1 = segunda, ...

  // Encontrar próxima segunda-feira
  const daysUntilMonday = (8 - today) % 7 || 7; // Se hoje é segunda, pega a próxima
  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(0, 0, 0, 0);

  console.log(`\n📆 Hoje: ${now.toISOString()} (dia da semana: ${today})`);
  console.log(`📆 Próxima segunda UTC: ${nextMonday.toISOString()}`);

  // 4. Criar 4 novas rodadas
  console.log('\n🚀 Criando novas rodadas...\n');

  const rodadas = [];
  for (let i = 0; i < 4; i++) {
    // Start: Segunda 00:00 UTC
    const startDate = new Date(nextMonday);
    startDate.setUTCDate(nextMonday.getUTCDate() + (i * 7));

    // End: Sábado 00:00 UTC (5 dias depois)
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 5);

    const rodada = await prisma.competition.create({
      data: {
        name: `Rodada ${i + 1} - Season Alpha`,
        leagueId: leagueId,
        seasonId: season.id,
        startDate: startDate,
        endDate: endDate,
        status: 'PENDING', // Aberta para escalação
        prizePool: 0,
        distributed: false
      }
    });

    rodadas.push(rodada);

    // Calcular quando abre escalação (7 dias antes do start)
    const escalacaoAbre = new Date(startDate);
    escalacaoAbre.setUTCDate(startDate.getUTCDate() - 7);

    console.log(`✅ ${rodada.name}`);
    console.log(`   ID: ${rodada.id}`);
    console.log(`   Start: ${startDate.toISOString()} (Domingo 21h BRT)`);
    console.log(`   End: ${endDate.toISOString()} (Sexta 21h BRT)`);
    console.log(`   Status: ${rodada.status} (aberta para escalação)`);
    console.log(`   Escalação disponível desde: AGORA (criação)`);
    console.log('');
  }

  // 5. Resumo
  console.log('\n=== RESUMO ===');
  console.log(`✅ ${rodadas.length} rodadas criadas`);
  console.log('\nCronograma:');
  console.log('┌──────────┬─────────────────────┬─────────────────────┬──────────┐');
  console.log('│ Rodada   │ Início (Snapshot)   │ Fim (Snapshot)      │ Status   │');
  console.log('├──────────┼─────────────────────┼─────────────────────┼──────────┤');

  for (const r of rodadas) {
    const startBRT = new Date(r.startDate);
    startBRT.setUTCHours(startBRT.getUTCHours() - 3);
    const endBRT = new Date(r.endDate);
    endBRT.setUTCHours(endBRT.getUTCHours() - 3);

    console.log(`│ ${r.name.padEnd(8).slice(0, 8)} │ ${r.startDate.toISOString().slice(0, 16)} │ ${r.endDate.toISOString().slice(0, 16)} │ ${r.status.padEnd(8)} │`);
  }
  console.log('└──────────┴─────────────────────┴─────────────────────┴──────────┘');

  console.log('\n⚠️ IMPORTANTE:');
  console.log('   - Cron START roda: Segunda 00:00 UTC (vercel.json: "0 0 * * 1")');
  console.log('   - Cron END roda: Sábado 00:00 UTC (vercel.json: "0 0 * * 6")');
  console.log('   - Verifique se CRON_SECRET está configurado no Vercel!');
  console.log('   - Teste o cron manualmente clicando "Run" no dashboard do Vercel');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
