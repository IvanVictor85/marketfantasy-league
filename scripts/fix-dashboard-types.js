const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo tipos no dashboard...\n');

const dashboardPath = path.join(__dirname, '..', 'src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// Corrigir a linha que cria o player object para garantir que symbol seja sempre string
const oldPlayerMapping = `        players: mainTeamData.players.map((player, index) => ({
          id: (player.symbol || player.symbol || '').toLowerCase(),
          position: index + 1,
          name: player.name,
          symbol: player.symbol || player.symbol, // Manter para compatibilidade
          image: player.image || '/icons/coinx.svg',
          currentPrice: player.currentPrice || player.currentPrice || 0, // Manter para compatibilidade
          points: player.points || 0,
          rarity: (player.rarity || "common") as "common" | "legendary" | "epic" | "rare",
          priceChange24h: player.priceChange24h || player.priceChange24h || 0, // Manter para compatibilidade
          priceChange7d: player.priceChange7d || player.priceChange7d || 0 // Manter para compatibilidade
        }))`;

const newPlayerMapping = `        players: mainTeamData.players.map((player, index) => ({
          id: (player.symbol || '').toLowerCase(),
          position: index + 1,
          name: player.name,
          symbol: player.symbol || '', // Garantir que sempre seja string
          image: player.image || '/icons/coinx.svg',
          currentPrice: player.currentPrice || 0,
          points: player.points || 0,
          rarity: (player.rarity || "common") as "common" | "legendary" | "epic" | "rare",
          priceChange24h: player.priceChange24h || 0,
          priceChange7d: player.priceChange7d || 0
        }))`;

content = content.replace(oldPlayerMapping, newPlayerMapping);

fs.writeFileSync(dashboardPath, content, 'utf8');
console.log('✅ dashboard/page.tsx types corrigidos!');
console.log('   - Removidas duplicações (player.symbol || player.symbol)');
console.log('   - Garantido que symbol é sempre string');
console.log('   - Removidas propriedades obsoletas (currentPrice || currentPrice)');
