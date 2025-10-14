const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLeagues() {
  try {
    console.log('=== VERIFICANDO LIGAS NO BANCO ===');
    
    const leagues = await prisma.league.findMany({
      select: {
        id: true,
        name: true,
        leagueType: true,
        isActive: true
      }
    });
    
    console.log('Ligas encontradas:');
    leagues.forEach(league => {
      console.log(`- ID: ${league.id}, Nome: ${league.name}, Tipo: ${league.leagueType}, Ativo: ${league.isActive}`);
    });
    
    // Verificar especificamente a liga ID '2'
    const league2 = await prisma.league.findUnique({ 
      where: { id: '2' } 
    });
    
    console.log('\n=== LIGA ID "2" (Liga de Ações Tokenizadas) ===');
    if (league2) {
      console.log(`Encontrada: ${league2.name} (Tipo: ${league2.leagueType}, Ativo: ${league2.isActive})`);
    } else {
      console.log('❌ Liga com ID "2" não encontrada no banco!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar ligas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeagues();