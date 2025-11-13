const fs = require('fs');
const path = require('path');

console.log('🔧 Adicionando marketCap e marketCapRank aos mocks...\n');

const dashboardPath = path.join(__dirname, '..', 'src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// Padrão: encontrar objetos que terminam com priceChange7d: X } ou priceChange7d: X },
// e adicionar marketCap e marketCapRank antes de fechar

// Buscar padrão: priceChange7d: NUMBER } ou priceChange7d: NUMBER },
const pattern = /priceChange7d: (-?[0-9.]+) (}|},)/g;

const replacement = 'priceChange7d: $1, marketCap: 0, marketCapRank: null $2';

const matches = content.match(pattern);
console.log(`🔍 Encontrados ${matches ? matches.length : 0} objetos Player para corrigir`);

content = content.replace(pattern, replacement);

fs.writeFileSync(dashboardPath, content, 'utf8');

console.log('✅ Campos marketCap e marketCapRank adicionados a todos os objetos Player!');
console.log('\n✨ Correção concluída!');
