import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTokensTable() {
  console.log('🔍 Verificando tabela Token...');
  
  try {
    // Contar total de tokens
    const totalTokens = await prisma.token.count();
    console.log('📊 Total de tokens na tabela:', totalTokens);
    
    if (totalTokens > 0) {
      // Buscar alguns tokens de exemplo
      const sampleTokens = await prisma.token.findMany({
        take: 10,
        select: {
          symbol: true,
          name: true,
          logoUrl: true
        }
      });
      
      console.log('📋 Primeiros 10 tokens:');
      sampleTokens.forEach((token, index) => {
        console.log(`  ${index + 1}. ${token.symbol} - ${token.name}`);
      });
      
      // Verificar se os tokens do time existem
      const teamTokens = ['BTC', 'BNB', 'ETH', 'SOL', 'LINK', 'HYPE', 'UNI', 'AAVE', 'ASTER', 'JLP'];
      console.log('\n🎯 Verificando tokens do time:');
      
      for (const symbol of teamTokens) {
        const token = await prisma.token.findUnique({
          where: { symbol },
          select: { symbol: true, name: true }
        });
        
        if (token) {
          console.log(`  ✅ ${symbol} - ${token.name}`);
        } else {
          console.log(`  ❌ ${symbol} - NÃO ENCONTRADO`);
        }
      }
    } else {
      console.log('⚠️ Tabela Token está vazia!');
    }
    
  } catch (error) {
    console.error('💥 Erro ao verificar tabela Token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTokensTable();