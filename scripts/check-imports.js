#!/usr/bin/env node

// Script para verificar todos os imports/exports e possíveis erros
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando imports/exports...\n');

// Arquivos que podem ter problemas
const filesToCheck = [
  'src/lib/coingecko-service.ts',
  'src/lib/scoring-service.ts', 
  'src/lib/prize-service.ts',
  'src/lib/prisma.ts',
  'src/types/auth.ts'
];

const issues = [];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - existe`);
    
    const content = fs.readFileSync(file, 'utf8');
    
    // Verificar exports
    const exports = content.match(/export\s+(interface|type|class|function|const)\s+(\w+)/g);
    if (exports) {
      console.log(`   📤 Exports: ${exports.map(e => e.split(' ')[2]).join(', ')}`);
    }
    
    // Verificar imports problemáticos
    const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
    if (imports) {
      imports.forEach(imp => {
        const match = imp.match(/from\s+['"]([^'"]+)['"]/);
        if (match) {
          const importPath = match[1];
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const resolvedPath = path.resolve(path.dirname(file), importPath);
            if (!fs.existsSync(resolvedPath) && !fs.existsSync(resolvedPath + '.ts') && !fs.existsSync(resolvedPath + '.js')) {
              issues.push(`❌ ${file}: Import não encontrado - ${importPath}`);
            }
          }
        }
      });
    }
  } else {
    issues.push(`❌ ${file} - arquivo não encontrado`);
  }
});

console.log('\n📋 Resumo:');
if (issues.length === 0) {
  console.log('✅ Nenhum problema encontrado!');
} else {
  issues.forEach(issue => console.log(issue));
}

console.log('\n🎯 Verificação completa!');
