const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// Substituições simples e diretas
content = content.replace(/player\.symbol \|\| player\.symbol/g, 'player.symbol || \'\'');
content = content.replace(/player\.currentPrice \|\| player\.currentPrice \|\| 0/g, 'player.currentPrice || 0');
content = content.replace(/player\.priceChange24h \|\| player\.priceChange24h \|\| 0/g, 'player.priceChange24h || 0');
content = content.replace(/player\.priceChange7d \|\| player\.priceChange7d \|\| 0/g, 'player.priceChange7d || 0');

fs.writeFileSync(dashboardPath, content, 'utf8');
console.log('✅ Dashboard corrigido!');
