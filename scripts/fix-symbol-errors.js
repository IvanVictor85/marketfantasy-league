const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo erros de "symbol" e propriedades duplicadas...\n');

const fixes = [
  {
    file: 'src/app/[locale]/teams/teams-content.tsx',
    fixes: [
      {
        description: 'Corrigir comparação de symbol na linha 386',
        find: /const isTokenAlreadyUsed = players\.some\(p => \(p\.symbol\) === symbol && p\.position !== position\);/,
        replace: 'const isTokenAlreadyUsed = players.some(p => (p.symbol) === token.symbol && p.position !== position);'
      }
    ]
  },
  {
    file: 'src/components/market/token-market.tsx',
    fixes: [
      {
        description: 'Corrigir Image alt com symbol',
        find: /alt=\{\`\$\{symbol\.name\} logo\`\}/g,
        replace: 'alt={`${token.name} logo`}'
      },
      {
        description: 'Corrigir ticker display com symbol',
        find: /parent\.textContent = symbol\.slice/g,
        replace: 'parent.textContent = token.symbol.slice'
      },
      {
        description: 'Corrigir badge com symbol',
        find: /\{symbol\}/g,
        replace: '{token.symbol}'
      }
    ]
  },
  {
    file: 'src/app/[locale]/dashboard/page.tsx',
    fixes: [
      {
        description: 'Remover propriedades duplicadas token e change_* no mapeamento de players',
        find: /symbol: player\.symbol \|\| player\.symbol,\s*\n\s*token: player\.symbol \|\| player\.symbol,/g,
        replace: 'symbol: player.symbol || player.symbol,'
      },
      {
        description: 'Remover propriedades price duplicadas',
        find: /currentPrice: ([^,\n]+),\s*\n\s*price: \1,/g,
        replace: 'currentPrice: $1,'
      },
      {
        description: 'Remover propriedades change_24h duplicadas',
        find: /priceChange24h: ([^,\n]+),\s*\n\s*change_24h: \1,/g,
        replace: 'priceChange24h: $1,'
      },
      {
        description: 'Remover propriedades change_7d duplicadas',
        find: /priceChange7d: ([^,\n]+),\s*\n\s*change_7d: \1/g,
        replace: 'priceChange7d: $1'
      }
    ]
  }
];

fixes.forEach(({ file, fixes: fileFixes }) => {
  const absolutePath = path.join(__dirname, '..', file);

  console.log(`\n📄 ${file}`);

  if (!fs.existsSync(absolutePath)) {
    console.log(`   ❌ Arquivo não encontrado`);
    return;
  }

  let content = fs.readFileSync(absolutePath, 'utf8');
  const originalContent = content;

  fileFixes.forEach((fix) => {
    const beforeLength = content.length;
    content = content.replace(fix.find, fix.replace);

    if (content.length !== beforeLength || content !== originalContent) {
      console.log(`   ✓ ${fix.description}`);
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(absolutePath, content, 'utf8');
    console.log(`   ✅ Arquivo corrigido!`);
  } else {
    console.log(`   ⚠️ Nenhuma correção necessária`);
  }
});

console.log('\n✨ Correções concluídas!');
