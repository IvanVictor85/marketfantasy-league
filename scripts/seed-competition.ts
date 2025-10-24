const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Top 20 tokens para simulação
const TOP_TOKENS = [
  'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'USDT', 'STETH', 'TRX',
  'AVAX', 'MATIC', 'LINK', 'UNI', 'LTC', 'ATOM', 'DOT', 'BCH', 'XLM', 'ALGO'
];

// Nomes de times para simulação
const TEAM_NAMES = [
  'Crypto Bulls FC',
  'Digital Warriors',
  'Blockchain United',
  'DeFi Champions',
  'NFT Legends',
  'Web3 Titans',
  'Smart Contract FC',
  'Token Masters',
  'Chain Runners'
];

// Gerar 10 tokens aleatórios do top 20
function generateRandomTokens() {
  const shuffled = [...TOP_TOKENS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10);
}

async function seedCompetition() {
  try {
    console.log('🏆 Criando simulação de competição...');
    
    // Buscar liga principal
    const mainLeague = await prisma.league.findFirst({
      where: {
        leagueType: 'MAIN',
        isActive: true
      }
    });
    
    if (!mainLeague) {
      console.error('❌ Liga principal não encontrada!');
      return;
    }
    
    console.log(`📊 Liga encontrada: ${mainLeague.name}`);
    
    // Criar 9 novos usuários e times
    for (let i = 0; i < 9; i++) {
      const teamName = TEAM_NAMES[i];
      const email = `team${i + 1}@competition.com`;
      const publicKey = `comp_${i + 1}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`\n👤 Criando usuário ${i + 1}/9: ${teamName}`);
      
      // Criar usuário
      const user = await prisma.user.create({
        data: {
          email,
          name: teamName,
          publicKey,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${teamName}`
        }
      });
      
      // Gerar tokens aleatórios
      const tokens = generateRandomTokens();
      console.log(`   🎯 Tokens: ${tokens.join(', ')}`);
      
      // Criar time
      const team = await prisma.team.create({
        data: {
          leagueId: mainLeague.id,
          userId: user.id,
          userWallet: publicKey,
          teamName,
          tokens: JSON.stringify(tokens),
          totalScore: null,
          rank: null,
          selectedMascotUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${teamName}`,
          hasValidEntry: true
        }
      });
      
      // Criar entrada na liga
      await prisma.leagueEntry.create({
        data: {
          leagueId: mainLeague.id,
          userId: user.id,
          userWallet: publicKey,
          transactionHash: `COMP_${Date.now()}_${i}`,
          amountPaid: mainLeague.entryFee,
          status: 'CONFIRMED',
          blockHeight: 123456789 + i
        }
      });
      
      console.log(`   ✅ Time criado: ${team.teamName} (ID: ${team.id})`);
    }
    
    // Atualizar contadores da liga
    const totalTeams = await prisma.team.count({
      where: { leagueId: mainLeague.id }
    });
    
    const totalEntries = await prisma.leagueEntry.count({
      where: { 
        leagueId: mainLeague.id,
        status: 'CONFIRMED'
      }
    });
    
    await prisma.league.update({
      where: { id: mainLeague.id },
      data: {
        participantCount: totalEntries,
        totalPrizePool: totalEntries * mainLeague.entryFee
      }
    });
    
    console.log(`\n🎉 Simulação criada com sucesso!`);
    console.log(`📊 Total de times: ${totalTeams}`);
    console.log(`💰 Total de entradas: ${totalEntries}`);
    console.log(`🏆 Prêmio total: ${totalEntries * mainLeague.entryFee} SOL`);
    
  } catch (error) {
    console.error('❌ Erro ao criar simulação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCompetition();
