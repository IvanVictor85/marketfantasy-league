const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// Encontrar o mapeamento e adicionar price logo após currentPrice
const pattern = /currentPrice: player\.currentPrice \|\| 0, \/\/ Manter para compatibilidade\n(\s+)points:/;
const replacement = `currentPrice: player.currentPrice || 0,
$1price: player.currentPrice || 0, // Obrigatório no tipo Player
$1points:`;

content = content.replace(pattern, replacement);

fs.writeFileSync(dashboardPath, content, 'utf8');
console.log('✅ Campo price adicionado com sucesso!');
