import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTeamData() {
  try {
    console.log('🔍 Verificando dados dos times no banco...');
    
    // Buscar todos os times
    const teams = await prisma.team.findMany({
      include: {
        league: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`📊 Total de times encontrados: ${teams.length}`);
    
    if (teams.length === 0) {
      console.log('❌ Nenhum time encontrado no banco de dados');
      return;
    }
    
    teams.forEach((team: any, index: number) => {
      console.log(`\n📋 Time ${index + 1}:`);
      console.log(`  ID: ${team.id}`);
      console.log(`  Liga: ${team.league.name}`);
      console.log(`  Carteira: ${team.userWallet}`);
      console.log(`  Nome: ${team.teamName}`);
      console.log(`  Entrada válida: ${team.hasValidEntry}`);
      console.log(`  Tokens: ${team.tokens}`);
      console.log(`  Criado em: ${team.createdAt}`);
      console.log(`  Atualizado em: ${team.updatedAt}`);
    });
    
    // Verificar especificamente o time do usuário
    const userWallet = 'H2312uRYYfSFsKiJeMwSriv6F7iEBkWxtPQCV6ArRAjT';
    const userTeam = await prisma.team.findFirst({
      where: {
        userWallet: userWallet
      },
      include: {
        league: true
      }
    });
    
    if (userTeam) {
      console.log('\n🎯 Time do usuário encontrado:');
      console.log(`  Liga: ${userTeam.league.name}`);
      console.log(`  Nome: ${userTeam.teamName}`);
      console.log(`  Tokens: ${userTeam.tokens}`);
      
      // Parse dos tokens para verificar a estrutura
      try {
        const parsedTokens = JSON.parse(userTeam.tokens);
        console.log('  Tokens parseados:', parsedTokens);
      } catch (e) {
        console.log('  ❌ Erro ao parsear tokens:', e);
      }
    } else {
      console.log('\n❌ Time do usuário não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeamData();