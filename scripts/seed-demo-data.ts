/**
 * Script de Seed para Dados de Demonstração
 *
 * Popula o banco de dados com dados fake para demonstração do sistema de competição
 *
 * Executar: npx tsx scripts/seed-demo-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tokens disponíveis para seleção
const AVAILABLE_TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { symbol: 'SOL', name: 'Solana', logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
  { symbol: 'BNB', name: 'BNB', logoUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
  { symbol: 'ADA', name: 'Cardano', logoUrl: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
  { symbol: 'AVAX', name: 'Avalanche', logoUrl: 'https://cryptologos.cc/logos/avalanche-avax-logo.png' },
  { symbol: 'MATIC', name: 'Polygon', logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
  { symbol: 'LINK', name: 'Chainlink', logoUrl: 'https://cryptologos.cc/logos/chainlink-link-logo.png' },
  { symbol: 'DOGE', name: 'Dogecoin', logoUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
  { symbol: 'SHIB', name: 'Shiba Inu', logoUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png' },
];

// Nomes criativos para os times
const TEAM_NAMES = [
  '🚀 Moon Lambo Gang',
  '💎 Diamond Hands Squad',
  '📈 Bull Run Warriors',
  '🐋 Whale Watchers',
  '⚡ Lightning Traders',
  '🔥 Fire Token Army',
  '🌟 Crypto All-Stars',
  '💰 Satoshi Disciples',
  '🎯 DeFi Degens',
  '🦄 Unicorn Hunters',
];

// Posições disponíveis
const POSITIONS = ['ATTACK', 'DEFENSE', 'SUPPORT', 'WILDCARD'];

// Wallets fake para os times
const FAKE_WALLETS = [
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq',
  'FE5uFpNfB1PqQzLkPbR6DRPRwJvnp7bVp6JvVJqXQsKp',
  'HxhWkVpk5NS4Rbuz1iPxe2DhMDPvqLx5DsUQA1jX8JaT',
  'J4Z8L1MhE3dFvBx7F5zCnF3WVgVs4G8K6j2XqKkNpqQc',
  'K9xXvL2pZqB7hDfG3sC5kJ8nM4tY6rW1aH5eP9vN3wQ2',
  'L5tR9xN3pK7mV2cB4hJ6dF8sG1aW9eY5qP3nM7kX2vC4',
  'M8jK3rT6nP2hV5cX9dB4fG7sL1aW6eY3qN5mK8pR2vC9',
  'N2vC5rK8pM3tY6hJ9dF4sG7aL1eW5qX3nP8bV2cR6kT9',
];

/**
 * Gera preço inicial mock para um token
 */
function generateStartPrice(symbol: string): number {
  const prices: Record<string, number> = {
    BTC: 45000 + Math.random() * 5000,
    ETH: 2500 + Math.random() * 500,
    SOL: 100 + Math.random() * 50,
    BNB: 300 + Math.random() * 50,
    ADA: 0.5 + Math.random() * 0.2,
    AVAX: 35 + Math.random() * 10,
    MATIC: 0.8 + Math.random() * 0.3,
    LINK: 15 + Math.random() * 5,
    DOGE: 0.08 + Math.random() * 0.02,
    SHIB: 0.00001 + Math.random() * 0.000005,
  };
  return prices[symbol] || Math.random() * 100;
}

/**
 * Gera variação de preço realista
 * Distribuição:
 * - 60% dos tokens: variação entre -5% e +15%
 * - 30% dos tokens: variação entre +15% e +30%
 * - 10% dos tokens: variação extrema entre -15% e +50%
 */
function generatePriceVariation(startPrice: number): number {
  const random = Math.random();
  let variation;

  if (random < 0.6) {
    // 60%: variação moderada (-5% a +15%)
    variation = (Math.random() * 0.2 - 0.05);
  } else if (random < 0.9) {
    // 30%: variação positiva boa (+15% a +30%)
    variation = (Math.random() * 0.15 + 0.15);
  } else {
    // 10%: variação extrema (-15% a +50%)
    const extremeRandom = Math.random();
    if (extremeRandom < 0.3) {
      variation = -(Math.random() * 0.15); // -15% a 0%
    } else {
      variation = (Math.random() * 0.35 + 0.15); // +15% a +50%
    }
  }

  return startPrice * (1 + variation);
}

/**
 * Seleciona 10 tokens aleatórios para um time
 */
function selectRandomTokens() {
  const shuffled = [...AVAILABLE_TOKENS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 10);

  return selected.map((token, index) => {
    const position = POSITIONS[index % POSITIONS.length];
    const startPrice = generateStartPrice(token.symbol);
    const currentPrice = generatePriceVariation(startPrice);

    return {
      symbol: token.symbol,
      name: token.name,
      logoUrl: token.logoUrl,
      position,
      startPrice,
      currentPrice,
    };
  });
}

/**
 * Calcula pontuação do time baseado nos tokens
 * Fórmula: média das variações percentuais de todos os tokens
 */
function calculateTeamScore(tokens: any[]): number {
  if (!tokens || tokens.length === 0) return 0;

  let totalPerformance = 0;
  tokens.forEach((token) => {
    const variation = ((token.currentPrice - token.startPrice) / token.startPrice) * 100;
    totalPerformance += variation;
  });

  return totalPerformance / tokens.length;
}

async function main() {
  console.log('🌱 Iniciando seed de dados de demonstração...\n');

  try {
    // 1. Buscar liga principal
    console.log('📋 Buscando liga principal (MAIN)...');
    let mainLeague = await prisma.league.findFirst({
      where: { leagueType: 'MAIN' },
    });

    if (!mainLeague) {
      console.log('⚠️  Liga principal não encontrada. Criando uma nova...');
      mainLeague = await prisma.league.create({
        data: {
          name: 'Liga Principal CryptoFantasy',
          leagueType: 'MAIN',
          entryFee: 0.1,
          maxPlayers: null,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          isActive: true,
          treasuryPda: 'DemoTreasuryPDA123456789',
          adminWallet: 'AdminWallet123456789',
          protocolWallet: 'ProtocolWallet123456789',
          status: 'ACTIVE',
          prizeDistribution: JSON.stringify({ first: 50, second: 30, third: 20 }),
          totalPrizePool: 10.0,
          participantCount: 0,
        },
      });
      console.log('✅ Liga principal criada!\n');
    } else {
      console.log(`✅ Liga encontrada: ${mainLeague.name}\n`);
    }

    // 2. Limpar dados antigos de demonstração (opcional)
    console.log('🧹 Limpando dados antigos de demonstração...');
    await prisma.team.deleteMany({
      where: {
        leagueId: mainLeague.id,
        teamName: { in: TEAM_NAMES },
      },
    });
    console.log('✅ Dados antigos removidos\n');

    // 3. Criar 5 times fake
    console.log('👥 Criando 5 times de demonstração...');
    const teams = [];

    const teamsToCreate = [];

    for (let i = 0; i < 5; i++) {
      const teamName = TEAM_NAMES[i];
      const userWallet = FAKE_WALLETS[i];
      const tokens = selectRandomTokens();
      const totalScore = calculateTeamScore(tokens);

      teamsToCreate.push({
        teamName,
        userWallet,
        tokens,
        totalScore,
      });
    }

    // Ordenar por pontuação para definir ranks corretos
    teamsToCreate.sort((a, b) => b.totalScore - a.totalScore);

    // Criar usuários demo primeiro
    console.log('👤 Criando usuários demo...');
    const demoUsers = [];
    for (let i = 1; i <= 5; i++) {
      const user = await prisma.user.create({
        data: {
          id: 'demo-user-' + i,
          email: `demo${i}@example.com`,
          name: `Usuário Demo ${i}`,
          publicKey: teamsToCreate[i-1].userWallet,
        },
      });
      demoUsers.push(user);
      console.log(`  ✅ Usuário ${i}: ${user.email}`);
    }

    // Criar times no banco com ranks corretos
    for (let i = 0; i < teamsToCreate.length; i++) {
      const { teamName, userWallet, tokens, totalScore } = teamsToCreate[i];
      const rank = i + 1;
      const userId = 'demo-user-' + (i + 1);

      const team = await prisma.team.create({
        data: {
          leagueId: mainLeague.id,
          userId: userId,
          userWallet,
          teamName,
          tokens: JSON.stringify(tokens),
          totalScore,
          rank,
          selectedMascotUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${teamName}`,
          hasValidEntry: true,
        },
      });

      // TAREFA 1: Criar entrada na liga para cada time demo
      await prisma.leagueEntry.create({
        data: {
          leagueId: mainLeague.id,
          userId: userId,
          userWallet: userWallet,
          transactionHash: `DEMO_${Date.now()}_${i}`,
          amountPaid: mainLeague.entryFee,
          status: 'CONFIRMED',
          blockHeight: 987654321 + i
        }
      });

      teams.push(team);
      console.log(`  ✅ ${rank}º ${teamName} - Pontuação: ${totalScore.toFixed(2)}%`);
    }

    console.log(`\n✅ ${teams.length} times criados com sucesso!\n`);

    // 4. Atualizar contagem de participantes na liga
    await prisma.league.update({
      where: { id: mainLeague.id },
      data: {
        participantCount: teams.length,
        totalPrizePool: teams.length * 0.1, // 0.1 SOL por time
      },
    });

    // 5. Criar competição de demonstração
    console.log('🏆 Criando competição de demonstração...');

    const now = new Date();
    const startTime = new Date(now.getTime() + 1 * 60 * 1000); // Começa em 1 minuto
    const endTime = new Date(now.getTime() + 11 * 60 * 1000); // Termina em 11 minutos (10 min de duração)

    // Verificar se já existe uma competição ativa
    const existingCompetition = await prisma.competition.findFirst({
      where: {
        leagueId: mainLeague.id,
        status: { in: ['pending', 'active'] },
      },
    });

    let competition;

    if (existingCompetition) {
      console.log('⚠️  Já existe uma competição ativa. Atualizando...');
      competition = await prisma.competition.update({
        where: { id: existingCompetition.id },
        data: {
          startTime,
          endTime,
          status: 'pending',
          prizePool: teams.length * 0.1,
          distributed: false,
        },
      });
    } else {
      competition = await prisma.competition.create({
        data: {
          leagueId: mainLeague.id,
          startTime,
          endTime,
          status: 'pending',
          prizePool: teams.length * 0.1, // Total do prize pool
          distributed: false,
        },
      });
    }

    console.log(`✅ Competição criada!`);
    console.log(`   ID: ${competition.id}`);
    console.log(`   Status: ${competition.status}`);
    console.log(`   Início: ${startTime.toLocaleString('pt-BR')}`);
    console.log(`   Término: ${endTime.toLocaleString('pt-BR')}`);
    console.log(`   Prize Pool: ${competition.prizePool} SOL\n`);

    // 6. Resumo final
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 SEED CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 Liga: ${mainLeague.name}`);
    console.log(`👥 Times criados: ${teams.length}`);
    console.log(`🏆 Competição ID: ${competition.id}`);
    console.log(`💰 Prize Pool: ${competition.prizePool} SOL`);
    console.log('═══════════════════════════════════════════════════\n');

    console.log('🌐 Acesse a competição em:');
    console.log(`   http://localhost:3000/pt/competition/${competition.id}\n`);

    console.log('📝 Rankings dos times:');
    teams
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .forEach((team, index) => {
        console.log(`   ${index + 1}º - ${team.teamName} - ${team.totalScore?.toFixed(2)} pts`);
      });

    console.log('\n✨ Pronto para demonstração!\n');
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar seed
main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
