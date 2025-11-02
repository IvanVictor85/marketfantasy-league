/**
 * Script para adicionar campos obrigatórios (currentPrice, priceChange24h, etc.)
 * aos objetos mock em expanded-tokens.ts
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'expanded-tokens.ts');

// Ler o arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Padrão para encontrar cada objeto no array (começando com id e terminando com rarity)
// Vamos procurar por objetos que têm price mas não têm currentPrice
const objectRegex = /(\s+\{[\s\S]*?price:\s*[\d.]+,[\s\S]*?rarity:\s*'(?:common|rare|epic|legendary)'[\s\S]*?\})/g;

let matches = content.match(objectRegex);
if (!matches) {
  console.log('❌ Nenhum objeto encontrado para atualizar');
  process.exit(1);
}

console.log(`✅ Encontrados ${matches.length} objetos para atualizar`);

// Para cada objeto, adicionar os campos obrigatórios logo após 'image'
content = content.replace(
  /(image:\s*'[^']*',)\n(\s+)(price:)/g,
  (match, imageField, indent, priceField) => {
    return `${imageField}\n${indent}// Campos obrigatórios (novos nomes padronizados)\n${indent}currentPrice: 0, // Será preenchido abaixo\n${indent}priceChange24h: 0,\n${indent}priceChange7d: 0,\n${indent}marketCap: 0,\n${indent}totalVolume: 0,\n${indent}marketCapRank: null,\n${indent}// Campos opcionais (nomes antigos - compatibilidade)\n${indent}${priceField}`;
  }
);

// Agora vamos atualizar cada objeto para copiar os valores dos campos antigos para os novos
// Padrão: encontrar price e copiar para currentPrice
content = content.replace(
  /currentPrice:\s*0,\s*\/\/ Será preenchido abaixo\n(\s+)priceChange24h:\s*0,\n(\s+)priceChange7d:\s*0,\n(\s+)marketCap:\s*0,\n(\s+)totalVolume:\s*0,\n(\s+)marketCapRank:\s*null,\n(\s+)\/\/ Campos opcionais[\s\S]*?price:\s*([\d.]+),[\s\S]*?change_24h:\s*([-\d.]+),[\s\S]*?change_7d:\s*([-\d.]+),[\s\S]*?market_cap:\s*([\d.]+),[\s\S]*?volume_24h:\s*([\d.]+),/g,
  (match, indent1, indent2, indent3, indent4, indent5, indent6, priceValue, change24hValue, change7dValue, marketCapValue, volumeValue) => {
    return `currentPrice: ${priceValue},\n${indent1}priceChange24h: ${change24hValue},\n${indent2}priceChange7d: ${change7dValue},\n${indent3}marketCap: ${marketCapValue},\n${indent4}totalVolume: ${volumeValue},\n${indent5}marketCapRank: null,\n${indent6}// Campos opcionais (nomes antigos - compatibilidade)\n${indent6}price: ${priceValue},\n    change_24h: ${change24hValue},\n    change_7d: ${change7dValue},\n    market_cap: ${marketCapValue},\n    volume_24h: ${volumeValue},`;
  }
);

// Salvar de volta
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Arquivo atualizado com sucesso!');
console.log(`📄 ${filePath}`);
