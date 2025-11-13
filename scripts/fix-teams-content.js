const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo teams-content.tsx...\n');

const teamsContentPath = path.join(__dirname, '..', 'src/app/[locale]/teams/teams-content.tsx');
let content = fs.readFileSync(teamsContentPath, 'utf8');

// Remover linha 394: price: token.currentPrice || token.currentPrice || 0,
content = content.replace(/price: token\.currentPrice \|\| token\.currentPrice \|\| 0,\s*/g, '');

// Remover linha 601: price: tokenDetail?.currentPrice || tokenDetail?.price || existingPlayer?.currentPrice || existingPlayer?.price || 0,
content = content.replace(/price: tokenDetail\?\.currentPrice[^,]*,\s*/g, '');

// Remover referências a .price (substituir por .currentPrice)
content = content.replace(/existingPlayer\?\.price/g, 'existingPlayer?.currentPrice');
content = content.replace(/tokenDetail\?\.price/g, 'tokenDetail?.currentPrice');

// Remover referências a .change_24h (substituir por .priceChange24h)
content = content.replace(/existingPlayer\?\.change_24h/g, 'existingPlayer?.priceChange24h');
content = content.replace(/tokenDetail\?\.change_24h/g, 'tokenDetail?.priceChange24h');

// Remover referências a .change_7d (substituir por .priceChange7d)
content = content.replace(/existingPlayer\?\.change_7d/g, 'existingPlayer?.priceChange7d');
content = content.replace(/tokenDetail\?\.change_7d/g, 'tokenDetail?.priceChange7d');

// Adicionar marketCap e marketCapRank aos objetos Player
// Encontrar padrão: priceChange7d: ... },
content = content.replace(
  /(priceChange7d: [^,]+),(\s*};)/g,
  '$1,\n              marketCap: 0,\n              marketCapRank: null$2'
);

fs.writeFileSync(teamsContentPath, content, 'utf8');

console.log('✅ teams-content.tsx corrigido!');
console.log('\n📋 Alterações:');
console.log('   - Removido campo "price"');
console.log('   - Substituído .price por .currentPrice');
console.log('   - Substituído .change_24h por .priceChange24h');
console.log('   - Substituído .change_7d por .priceChange7d');
console.log('   - Adicionados marketCap e marketCapRank');
