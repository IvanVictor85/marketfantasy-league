const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo tipo Player no dashboard/page.tsx...\n');

const dashboardPath = path.join(__dirname, '..', 'src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// Corrigir o .map() que cria objetos Player
const oldMap = `        players: mainTeamData.players.map((player, index) => ({
          id: (player.symbol || '' || '').toLowerCase(),
          position: index + 1,
          name: player.name,
          symbol: player.symbol || '', // Manter para compatibilidade
          image: player.image || '/icons/coinx.svg',
          currentPrice: player.currentPrice || 0, // Manter para compatibilidade
          price: player.currentPrice || 0, // Obrigatório no tipo Player
          points: player.points || 0,
          rarity: (player.rarity || "common") as "common" | "legendary" | "epic" | "rare",
          priceChange24h: player.priceChange24h || 0, // Manter para compatibilidade
          priceChange7d: player.priceChange7d || 0 // Manter para compatibilidade
        }))`;

const newMap = `        players: mainTeamData.players.map((player, index) => ({
          id: (player.symbol || '').toLowerCase(),
          position: index + 1,
          name: player.name,
          symbol: player.symbol || '',
          image: player.image || '/icons/coinx.svg',
          currentPrice: player.currentPrice || 0,
          priceChange24h: player.priceChange24h || 0,
          priceChange7d: player.priceChange7d || 0,
          marketCap: player.marketCap || 0,
          marketCapRank: player.marketCapRank || null,
          points: player.points || 0,
          rarity: (player.rarity || "common") as "common" | "legendary" | "epic" | "rare"
        }))`;

if (content.includes(oldMap)) {
  content = content.replace(oldMap, newMap);
  fs.writeFileSync(dashboardPath, content, 'utf8');
  console.log('✅ Tipo Player corrigido no dashboard (removido campo "price", adicionados marketCap e marketCapRank)');
} else {
  console.log('⚠️ Padrão não encontrado. Tentando busca flexível...');

  // Busca alternativa: procurar por "price: player.currentPrice"
  if (content.includes('price: player.currentPrice')) {
    content = content.replace(
      /price: player\.currentPrice \|\| 0, \/\/ Obrigatório no tipo Player/g,
      ''
    );

    // Adicionar campos faltantes antes de "points:"
    content = content.replace(
      /points: player\.points \|\| 0,/g,
      'marketCap: player.marketCap || 0,\n          marketCapRank: player.marketCapRank || null,\n          points: player.points || 0,'
    );

    fs.writeFileSync(dashboardPath, content, 'utf8');
    console.log('✅ Tipo Player corrigido via busca alternativa');
  } else {
    console.log('❌ Não foi possível encontrar o padrão para corrigir');
  }
}

console.log('\n✨ Correção concluída!');
