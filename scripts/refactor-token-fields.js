const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando refatoração global dos campos de token...\n');

// Lista de arquivos para refatorar
const filesToRefactor = [
  'src/app/[locale]/teams/teams-content.tsx',
  'src/components/market/token-market.tsx',
  'src/app/[locale]/dashboard/page.tsx',
  'src/app/[locale]/analise/page.tsx',
  'src/components/field/soccer-field.tsx'
];

// Função para refatorar um arquivo
function refactorFile(filePath) {
  const absolutePath = path.join(__dirname, '..', filePath);

  console.log(`\n📄 Refatorando: ${filePath}`);

  if (!fs.existsSync(absolutePath)) {
    console.log(`❌ Arquivo não encontrado: ${absolutePath}`);
    return;
  }

  let content = fs.readFileSync(absolutePath, 'utf8');
  const originalContent = content;

  // PASSO 1: Remover propriedades antigas duplicadas da estrutura Player/Token
  // Manter apenas a versão NOVA (padrão) dos campos

  // Padrão: propriedades que aparecem em objetos literais e devem ter versões duplicadas removidas
  // Exemplo: { token: x, symbol: x } -> { symbol: x }
  //         { price: x, currentPrice: x } -> { currentPrice: x }

  // Para remover duplicações em objetos literais:
  // 1. token: usado junto com symbol -> remover token
  content = content.replace(/\btoken:\s*([^,\n}]+),\s*\n/g, '');

  // 2. price: usado junto com currentPrice -> remover price (exceto quando é "currentPrice || price")
  // Precisamos ser mais cuidadosos aqui - só remover quando ambos estão presentes
  // Vamos fazer uma regex que encontra: price: valor, seguido (eventualmente) por currentPrice
  // Mas isso é complexo, então vamos fazer diferente

  // 3. change_24h: usado junto com priceChange24h -> remover change_24h
  content = content.replace(/\bchange_24h:\s*([^,\n}]+),\s*\n/g, '');

  // 4. change_7d: usado junto com priceChange7d -> remover change_7d
  content = content.replace(/\bchange_7d:\s*([^,\n}]+),\s*\n/g, '');


  // PASSO 2: Substituir LEITURAS de campos antigos por campos novos
  // Esses são os mais críticos pois causam erros de tipo

  // 2.1: Substituir .token por .symbol em acessos a propriedades
  // Mas APENAS onde NÃO seja uma definição de tipo ou atribuição
  // Padrão: player.token ou a.token (mas não token:)
  content = content.replace(/\b(\w+)\.token\b(?!\s*:)/g, '$1.symbol');

  // 2.2: Substituir .price por .currentPrice em acessos
  // Cuidado: não substituir em "priceChange24h" ou similar
  content = content.replace(/\b(\w+)\.price\b(?!Change)/g, '$1.currentPrice');

  // 2.3: Substituir .change_24h por .priceChange24h
  content = content.replace(/\b(\w+)\.change_24h\b/g, '$1.priceChange24h');

  // 2.4: Substituir .change_7d por .priceChange7d
  content = content.replace(/\b(\w+)\.change_7d\b/g, '$1.priceChange7d');

  // 2.5: Substituir .market_cap por .marketCap
  content = content.replace(/\b(\w+)\.market_cap\b/g, '$1.marketCap');


  // PASSO 3: Corrigir expressões de fallback comuns
  // Exemplo: (player.token || '?') -> (player.symbol || '?')
  // Já foi feito acima, mas vamos garantir alguns casos especiais

  // 3.1: Fallbacks em template strings
  content = content.replace(/\$\{[^}]*\btoken\b[^}]*\}/g, (match) => {
    return match.replace(/\btoken\b/g, 'symbol');
  });

  // 3.2: Corrigir player.symbol || player.token para apenas player.symbol
  // (Já que todos os objetos DEVEM ter symbol agora)
  content = content.replace(/\b(\w+)\.symbol\s*\|\|\s*\1\.token/g, '$1.symbol');
  content = content.replace(/\b(\w+)\.currentPrice\s*\|\|\s*\1\.price/g, '$1.currentPrice');
  content = content.replace(/\b(\w+)\.priceChange24h\s*\|\|\s*\1\.change_24h/g, '$1.priceChange24h');
  content = content.replace(/\b(\w+)\.priceChange7d\s*\|\|\s*\1\.change_7d/g, '$1.priceChange7d');
  content = content.replace(/\b(\w+)\.marketCap\s*\|\|\s*\1\.market_cap/g, '$1.marketCap');


  // Verificar se houve mudanças
  if (content !== originalContent) {
    fs.writeFileSync(absolutePath, content, 'utf8');
    console.log(`✅ Arquivo refatorado com sucesso!`);

    // Mostrar estatísticas de mudanças
    const changes = [];
    if (originalContent.match(/\btoken:/g)?.length > content.match(/\btoken:/g)?.length) {
      changes.push('✓ Removidas propriedades "token" duplicadas');
    }
    if (originalContent.match(/\.token\b/g)?.length > content.match(/\.token\b/g)?.length) {
      changes.push('✓ Substituídos acessos .token por .symbol');
    }
    if (originalContent.match(/\.price\b/g)?.length > content.match(/\.price\b/g)?.length) {
      changes.push('✓ Substituídos acessos .price por .currentPrice');
    }
    if (originalContent.match(/\.change_24h/g)?.length > content.match(/\.change_24h/g)?.length) {
      changes.push('✓ Substituídos .change_24h por .priceChange24h');
    }
    if (originalContent.match(/\.change_7d/g)?.length > content.match(/\.change_7d/g)?.length) {
      changes.push('✓ Substituídos .change_7d por .priceChange7d');
    }
    if (originalContent.match(/\.market_cap/g)?.length > content.match(/\.market_cap/g)?.length) {
      changes.push('✓ Substituídos .market_cap por .marketCap');
    }

    if (changes.length > 0) {
      console.log('   Mudanças aplicadas:');
      changes.forEach(change => console.log(`   ${change}`));
    }
  } else {
    console.log(`⚠️ Nenhuma mudança necessária`);
  }
}

// Executar refatoração em todos os arquivos
console.log(`📋 Total de arquivos para refatorar: ${filesToRefactor.length}\n`);

filesToRefactor.forEach((file, index) => {
  console.log(`\n[${ index + 1}/${filesToRefactor.length}]`);
  refactorFile(file);
});

console.log('\n\n✨ Refatoração global concluída!');
console.log('\n📊 Próximos passos:');
console.log('   1. Revisar as mudanças feitas');
console.log('   2. Executar "npm run dev" para verificar erros');
console.log('   3. Testar a aplicação');
