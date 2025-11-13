const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo erros finais...\n');

// Fix 1: teams-content.tsx linha 384 - symbol.symbol deveria ser token.symbol
const teamsContentPath = path.join(__dirname, '..', 'src/app/[locale]/teams/teams-content.tsx');
let teamsContent = fs.readFileSync(teamsContentPath, 'utf8');
teamsContent = teamsContent.replace(
  /setPaymentError\(`O token \$\{symbol\.symbol\}/,
  'setPaymentError(`O token ${token.symbol}'
);
fs.writeFileSync(teamsContentPath, teamsContent, 'utf8');
console.log('✅ teams-content.tsx corrigido');

// Fix 2: token-market.tsx linhas 712-715 - symbol deveria ser token
const tokenMarketPath = path.join(__dirname, '..', 'src/components/market/token-market.tsx');
let tokenMarket = fs.readFileSync(tokenMarketPath, 'utf8');

// Corrigir as 4 ocorrências de "symbol." que deveriam ser "token." no mobile layout
tokenMarket = tokenMarket.replace(
  /selectedPeriod === 'oneHour' \? \(symbol\.change_1h \|\| 0\)/g,
  "selectedPeriod === 'oneHour' ? (token.change_1h || 0)"
);
tokenMarket = tokenMarket.replace(
  /selectedPeriod === 'twentyFourHour' \? \(symbol\.priceChange24h \|\| symbol\.priceChange24h \|\| 0\)/g,
  "selectedPeriod === 'twentyFourHour' ? (token.priceChange24h || token.priceChange24h || 0)"
);
tokenMarket = tokenMarket.replace(
  /selectedPeriod === 'sevenDay' \? \(symbol\.priceChange7d \|\| symbol\.priceChange7d \|\| 0\)/g,
  "selectedPeriod === 'sevenDay' ? (token.priceChange7d || token.priceChange7d || 0)"
);
tokenMarket = tokenMarket.replace(
  /selectedPeriod === 'thirtyDay' \? \(symbol\.change_30d \|\| 0\)/g,
  "selectedPeriod === 'thirtyDay' ? (token.change_30d || 0)"
);

fs.writeFileSync(tokenMarketPath, tokenMarket, 'utf8');
console.log('✅ token-market.tsx corrigido');

// Fix 3: dashboard/page.tsx - Remover propriedades duplicadas completamente
const dashboardPath = path.join(__dirname, '..', 'src/app/[locale]/dashboard/page.tsx');
let dashboard = fs.readFileSync(dashboardPath, 'utf8');

// Procurar e remover linhas com token:, price:, change_24h:, change_7d: duplicadas
// Padrão: essas linhas aparecem logo DEPOIS de symbol:, currentPrice:, priceChange24h:, priceChange7d:
dashboard = dashboard.replace(
  /(\s+symbol: [^,\n]+,)\s*\n\s+token: [^,\n]+,/g,
  '$1'
);
dashboard = dashboard.replace(
  /(\s+currentPrice: [^,\n]+,)\s*\n\s+price: [^,\n]+,/g,
  '$1'
);
dashboard = dashboard.replace(
  /(\s+priceChange24h: [^,\n]+,)\s*\n\s+change_24h: [^,\n]+,/g,
  '$1'
);
dashboard = dashboard.replace(
  /(\s+priceChange7d: [^,\n]+)(,?)\s*\n\s+change_7d: [^,\n]+/g,
  '$1$2'
);

fs.writeFileSync(dashboardPath, dashboard, 'utf8');
console.log('✅ dashboard/page.tsx corrigido');

console.log('\n✨ Todas as correções aplicadas com sucesso!');
