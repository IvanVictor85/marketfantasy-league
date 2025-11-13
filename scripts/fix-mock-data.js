const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo mockUserData no dashboard/page.tsx...\n');

const dashboardPath = path.join(__dirname, '..', 'src/app/[locale]/dashboard/page.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// Remover campos antigos: token, price, change_24h, change_7d
// Adicionar campos novos: marketCap, marketCapRank

const fixes = [
  // Remover ", token: "XXX""
  { from: /, token: "[A-Z]+"/g, to: '' },
  // Remover ", price: XXXX"
  { from: /, price: [0-9.]+/g, to: '' },
  // Remover ", change_24h: XX.X"
  { from: /, change_24h: -?[0-9.]+/g, to: '' },
  // Remover ", change_7d: XX.X"
  { from: /, change_7d: -?[0-9.]+/g, to: '' },
];

console.log('🔍 Aplicando correções...');
let fixCount = 0;

fixes.forEach((fix, index) => {
  const matches = content.match(fix.from);
  if (matches) {
    content = content.replace(fix.from, fix.to);
    fixCount += matches.length;
    console.log(`  ✅ Fix ${index + 1}: ${matches.length} ocorrências removidas`);
  }
});

// Adicionar marketCap e marketCapRank antes de "points:"
// Padrão: currentPrice: XXX, priceChange24h: XXX, priceChange7d: XXX, points:
const addFields = /currentPrice: ([0-9.]+), priceChange24h: (-?[0-9.]+), priceChange7d: (-?[0-9.]+), points:/g;

content = content.replace(
  addFields,
  'currentPrice: $1, priceChange24h: $2, priceChange7d: $3, marketCap: 0, marketCapRank: null, points:'
);

console.log(`  ✅ Campos marketCap e marketCapRank adicionados`);

fs.writeFileSync(dashboardPath, content, 'utf8');

console.log(`\n✨ ${fixCount} campos antigos removidos!`);
console.log('✨ Campos novos adicionados ao mockUserData!');
