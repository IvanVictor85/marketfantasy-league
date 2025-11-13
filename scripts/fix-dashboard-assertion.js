const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// Adicionar `price` que falta (é obrigatório no tipo Player)
const oldMapping = `          currentPrice: player.currentPrice || 0,
          points: player.points || 0,
          rarity: (player.rarity || "common") as "common" | "legendary" | "epic" | "rare",`;

const newMapping = `          currentPrice: player.currentPrice || 0,
          price: player.currentPrice || 0, // Obrigatório no tipo Player
          points: player.points || 0,
          rarity: (player.rarity || "common") as "common" | "legendary" | "epic" | "rare",`;

content = content.replace(oldMapping, newMapping);

fs.writeFileSync(dashboardPath, content, 'utf8');
console.log('✅ Campo price adicionado ao mapeamento de players');
