/**
 * Script de diagnóstico das rodadas e snapshots
 * Uso: node scripts/diagnostico-rodadas.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== DIAGNÓSTICO COMPLETO DAS RODADAS ===\n');
  console.log(`Data atual: ${new Date().toISOString()}\n`);

  // 1. Buscar todas as competições
  const competitions = await prisma.competition.findMany({
    orderBy: { startDate: 'asc' },
    include: {
      league: { select: { name: true } },
      season: { select: { name: true } },
      userTeams: {
        select: {
          id: true,
          totalPoints: true,
          players: true,
          user: { select: { name: true } }
        }
      },
      competitionTokens: {
        select: {
          symbol: true,
          priceStart: true,
          priceStartDate: true,
          priceEnd: true,
          priceEndDate: true,
          percentChange: true
        }
      }
    }
  });

  console.log(`Total de competições: ${competitions.length}\n`);

  for (const comp of competitions) {
    console.log('═'.repeat(60));
    console.log(`📋 ${comp.name || comp.id}`);
    console.log('═'.repeat(60));
    console.log(`   ID: ${comp.id}`);
    console.log(`   Status: ${comp.status}`);
    console.log(`   Liga: ${comp.league?.name || 'N/A'}`);
    console.log(`   Season: ${comp.season?.name || 'N/A'}`);
    console.log(`   Start: ${comp.startDate?.toISOString() || 'N/A'}`);
    console.log(`   End: ${comp.endDate?.toISOString() || 'N/A'}`);
    console.log(`   Prizepool: ${comp.prizePool} SOL`);
    console.log(`   Distribuído: ${comp.distributed}`);

    // Times inscritos
    console.log(`\n   📊 TIMES INSCRITOS: ${comp.userTeams.length}`);
    if (comp.userTeams.length > 0) {
      for (const team of comp.userTeams) {
        const players = Array.isArray(team.players) ? team.players : [];
        console.log(`      - ${team.user.name}: ${Number(team.totalPoints).toFixed(2)}% (${players.length} tokens)`);
        if (players.length > 0) {
          console.log(`        Tokens: ${players.join(', ')}`);
        }
      }
    }

    // Snapshots de tokens
    console.log(`\n   🪙 SNAPSHOTS: ${comp.competitionTokens.length} tokens`);
    if (comp.competitionTokens.length > 0) {
      const withStart = comp.competitionTokens.filter(t => t.priceStart !== null).length;
      const withEnd = comp.competitionTokens.filter(t => t.priceEnd !== null).length;
      console.log(`      - Com preço inicial: ${withStart}`);
      console.log(`      - Com preço final: ${withEnd}`);

      // Mostrar alguns tokens como exemplo
      const sample = comp.competitionTokens.slice(0, 5);
      for (const token of sample) {
        const change = token.percentChange !== null ? `${Number(token.percentChange).toFixed(2)}%` : 'N/A';
        console.log(`      ${token.symbol}: $${token.priceStart || 'N/A'} → $${token.priceEnd || 'N/A'} (${change})`);
      }
      if (comp.competitionTokens.length > 5) {
        console.log(`      ... e mais ${comp.competitionTokens.length - 5} tokens`);
      }
    } else {
      console.log(`      ⚠️ NENHUM SNAPSHOT ENCONTRADO!`);
      console.log(`      Isso significa que o cron de START não executou ou falhou.`);
    }

    console.log('');
  }

  // 2. Verificar env vars necessárias
  console.log('\n' + '═'.repeat(60));
  console.log('🔧 CONFIGURAÇÃO DO CRON');
  console.log('═'.repeat(60));
  console.log('Para o cron funcionar no Vercel, você precisa:');
  console.log('1. Configurar CRON_SECRET nas Environment Variables do Vercel');
  console.log('2. Verificar se vercel.json tem os crons configurados');
  console.log('3. Verificar os logs do Vercel em Functions → Cron');
  console.log('');
  console.log('Como testar manualmente:');
  console.log('- No Vercel Dashboard: Settings → Cron Jobs → clique "Run"');
  console.log('- Via curl (com CRON_SECRET):');
  console.log('  curl -X POST https://seu-app.vercel.app/api/cron/competition-start \\');
  console.log('    -H "Authorization: Bearer SEU_CRON_SECRET"');

  // 3. Próximas ações sugeridas
  console.log('\n' + '═'.repeat(60));
  console.log('📝 ANÁLISE');
  console.log('═'.repeat(60));

  const pendingWithTeams = competitions.filter(c => c.status === 'PENDING' && c.userTeams.length > 0);
  const activeNoSnapshot = competitions.filter(c => c.status === 'ACTIVE' && c.competitionTokens.length === 0);
  const activeWithSnapshot = competitions.filter(c => c.status === 'ACTIVE' && c.competitionTokens.length > 0);
  const teamsZeroScore = competitions.flatMap(c =>
    c.userTeams.filter(t => Number(t.totalPoints) === 0)
  );

  if (pendingWithTeams.length > 0) {
    console.log(`⏳ ${pendingWithTeams.length} rodada(s) PENDING com times escalados - aguardando início`);
  }

  if (activeNoSnapshot.length > 0) {
    console.log(`⚠️ ${activeNoSnapshot.length} rodada(s) ACTIVE sem snapshot - PROBLEMA!`);
    console.log('   O cron de START não criou os snapshots de preço.');
  }

  if (activeWithSnapshot.length > 0) {
    console.log(`✅ ${activeWithSnapshot.length} rodada(s) ACTIVE com snapshot`);
  }

  if (teamsZeroScore.length > 0) {
    console.log(`📊 ${teamsZeroScore.length} time(s) com pontuação zerada`);
    console.log('   Isso é normal se a rodada está ACTIVE (pontuação calculada no fim)');
    console.log('   OU se não houve snapshot no início da rodada.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
