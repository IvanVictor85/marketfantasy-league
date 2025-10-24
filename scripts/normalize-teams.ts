const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function normalizeTeams() {
  try {
    console.log('🔧 Normalizando dados dos times...');
    
    // Buscar todos os times
    const teams = await prisma.team.findMany();
    
    console.log(`📊 Encontrados ${teams.length} times para normalizar`);
    
    for (const team of teams) {
      console.log(`\n🔍 Processando time: ${team.teamName}`);
      console.log(`   Tokens atual: ${team.tokens}`);
      
      let normalizedTokens;
      
      try {
        const tokensData = JSON.parse(team.tokens);
        
        if (Array.isArray(tokensData)) {
          if (tokensData.length > 0 && typeof tokensData[0] === 'object') {
            // Array de objetos -> extrair symbols
            console.log('   📝 Convertendo array de objetos para array de strings');
            normalizedTokens = tokensData.map(token => {
              if (typeof token === 'object' && token.symbol) {
                return token.symbol;
              }
              return token;
            }).filter(symbol => typeof symbol === 'string');
          } else {
            // Já é array de strings
            console.log('   ✅ Já é array de strings');
            normalizedTokens = tokensData;
          }
        } else {
          console.log('   ⚠️ Formato inválido, usando array vazio');
          normalizedTokens = [];
        }
      } catch (error) {
        console.log('   ❌ Erro ao parsear tokens, usando array vazio');
        normalizedTokens = [];
      }
      
      // Garantir que temos exatamente 10 tokens
      if (normalizedTokens.length < 10) {
        const topTokens = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'USDT', 'STETH', 'TRX'];
        const missingTokens = topTokens.slice(0, 10 - normalizedTokens.length);
        normalizedTokens = [...normalizedTokens, ...missingTokens];
        console.log(`   🔧 Adicionando tokens faltantes: ${missingTokens.join(', ')}`);
      }
      
      // Atualizar o time
      await prisma.team.update({
        where: { id: team.id },
        data: {
          tokens: JSON.stringify(normalizedTokens),
          totalScore: null,
          rank: null
        }
      });
      
      console.log(`   ✅ Tokens normalizados: ${JSON.stringify(normalizedTokens)}`);
    }
    
    console.log('\n🎉 Normalização concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na normalização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

normalizeTeams();
