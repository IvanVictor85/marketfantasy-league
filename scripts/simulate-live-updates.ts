/**
 * Script de Simulação de Atualizações ao Vivo
 *
 * Simula mudanças em tempo real nos preços dos tokens e rankings
 * para demonstração visual do sistema
 *
 * Executar: npx tsx scripts/simulate-live-updates.ts [competitionId]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMPETITION_ID = process.argv[2] || '1';
const UPDATE_INTERVAL = 5000; // 5 segundos
const MAX_ITERATIONS = 20; // Rodar por ~100 segundos

let iteration = 0;

/**
 * Gera variação de preço realista (-5% a +5%)
 */
function generatePriceVariation(currentPrice: number): number {
  const variation = (Math.random() * 0.1 - 0.05); // -5% a +5%
  const newPrice = currentPrice * (1 + variation);
  return Math.max(newPrice, currentPrice * 0.5); // Nunca cair mais de 50%
}

/**
 * Calcula pontuação do time baseado na performance dos tokens
 */
function calculateTeamScore(tokens: any[]): number {
  let totalScore = 0;

  tokens.forEach((token) => {
    const priceChange = ((token.currentPrice - token.startPrice) / token.startPrice) * 100;

    // Pontos baseados na variação percentual e posição
    let positionMultiplier = 1;
    switch (token.position) {
      case 'ATTACK':
        positionMultiplier = 1.5;
        break;
      case 'DEFENSE':
        positionMultiplier = 1.2;
        break;
      case 'SUPPORT':
        positionMultiplier = 1.3;
        break;
      case 'WILDCARD':
        positionMultiplier = 2.0;
        break;
    }

    const tokenScore = priceChange * positionMultiplier * 10;
    totalScore += tokenScore;
  });

  return Math.max(totalScore, 0); // Não permitir score negativo
}

/**
 * Atualiza preços dos tokens e recalcula scores
 */
async function updatePricesAndScores() {
  try {
    console.log(`\n🔄 Iteração ${iteration + 1}/${MAX_ITERATIONS} - ${new Date().toLocaleTimeString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Buscar competição
    const competition = await prisma.competition.findUnique({
      where: { id: COMPETITION_ID },
      include: {
        league: {
          include: {
            teams: true,
          },
        },
      },
    });

    if (!competition) {
      console.error('❌ Competição não encontrada!');
      process.exit(1);
    }

    const teams = competition.league.teams;
    const updatedScores: { teamId: string; teamName: string; oldScore: number; newScore: number }[] = [];

    // Atualizar cada time
    for (const team of teams) {
      try {
        const tokens = JSON.parse(team.tokens);
        const oldScore = team.totalScore || 0;

        // Atualizar preços dos tokens
        const updatedTokens = tokens.map((token: any) => ({
          ...token,
          currentPrice: generatePriceVariation(token.currentPrice || token.startPrice),
        }));

        // Calcular nova pontuação
        const newScore = calculateTeamScore(updatedTokens);

        // Salvar no banco
        await prisma.team.update({
          where: { id: team.id },
          data: {
            tokens: JSON.stringify(updatedTokens),
            totalScore: newScore,
          },
        });

        updatedScores.push({
          teamId: team.id,
          teamName: team.teamName,
          oldScore,
          newScore,
        });
      } catch (err) {
        console.error(`❌ Erro ao atualizar time ${team.teamName}:`, err);
      }
    }

    // Recalcular rankings
    const sortedTeams = updatedScores.sort((a, b) => b.newScore - a.newScore);

    for (let i = 0; i < sortedTeams.length; i++) {
      await prisma.team.update({
        where: { id: sortedTeams[i].teamId },
        data: { rank: i + 1 },
      });
    }

    // Exibir mudanças
    console.log('\n📊 Rankings Atualizados:');
    sortedTeams.forEach((team, index) => {
      const scoreChange = team.newScore - team.oldScore;
      const arrow = scoreChange > 0 ? '📈' : scoreChange < 0 ? '📉' : '➡️';
      const color = scoreChange > 0 ? '\x1b[32m' : scoreChange < 0 ? '\x1b[31m' : '\x1b[33m';
      const reset = '\x1b[0m';

      console.log(
        `   ${index + 1}º ${arrow} ${team.teamName.padEnd(30)} ` +
          `${color}${team.newScore.toFixed(2)}${reset} pts ` +
          `(${scoreChange >= 0 ? '+' : ''}${scoreChange.toFixed(2)})`
      );
    });

    // Verificar se deve mudar status da competição
    const now = new Date();
    const startTime = new Date(competition.startTime);
    const endTime = new Date(competition.endTime);

    if (competition.status === 'pending' && now >= startTime) {
      await prisma.competition.update({
        where: { id: COMPETITION_ID },
        data: { status: 'active' },
      });
      console.log('\n🏁 Competição INICIADA!');
    }

    if (competition.status === 'active' && now >= endTime) {
      // Finalizar competição e definir vencedores
      const topThree = sortedTeams.slice(0, 3).map((t) => {
        const team = teams.find((tm) => tm.id === t.teamId);
        return team?.userWallet;
      });

      await prisma.competition.update({
        where: { id: COMPETITION_ID },
        data: {
          status: 'completed',
          winners: JSON.stringify(topThree),
        },
      });

      console.log('\n🏆 Competição FINALIZADA!');
      console.log('\n🥇 VENCEDORES:');
      sortedTeams.slice(0, 3).forEach((team, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        console.log(`   ${medals[index]} ${team.teamName} - ${team.newScore.toFixed(2)} pts`);
      });

      console.log('\n✅ Simulação concluída!');
      await prisma.$disconnect();
      process.exit(0);
    }

    console.log(`\n⏰ Próxima atualização em ${UPDATE_INTERVAL / 1000}s...`);
  } catch (error) {
    console.error('❌ Erro durante atualização:', error);
  }
}

/**
 * Inicia simulação
 */
async function startSimulation() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       🎬 SIMULAÇÃO DE ATUALIZAÇÕES AO VIVO 🎬            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Competition ID: ${COMPETITION_ID}`);
  console.log(`⏱️  Intervalo: ${UPDATE_INTERVAL / 1000}s`);
  console.log(`🔁 Iterações máximas: ${MAX_ITERATIONS}`);
  console.log('\nPressione Ctrl+C para parar a qualquer momento.\n');

  // Primeira atualização imediata
  await updatePricesAndScores();
  iteration++;

  // Agendar próximas atualizações
  const interval = setInterval(async () => {
    if (iteration >= MAX_ITERATIONS) {
      console.log('\n⏹️  Número máximo de iterações atingido.');
      clearInterval(interval);
      await prisma.$disconnect();
      process.exit(0);
    }

    await updatePricesAndScores();
    iteration++;
  }, UPDATE_INTERVAL);

  // Handler para Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\n\n⏹️  Simulação interrompida pelo usuário.');
    clearInterval(interval);
    await prisma.$disconnect();
    process.exit(0);
  });
}

// Executar simulação
startSimulation().catch(async (error) => {
  console.error('❌ Erro fatal:', error);
  await prisma.$disconnect();
  process.exit(1);
});
