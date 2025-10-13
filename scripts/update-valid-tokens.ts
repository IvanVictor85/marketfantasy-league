import fs from 'fs';
import path from 'path';

/**
 * Script para atualizar automaticamente a lista de tokens válidos
 * baseada nos dados da API /api/tokens
 */

async function updateValidTokens() {
  try {
    console.log('🔍 Buscando tokens da API...');
    
    // Buscar tokens da API local
    const response = await fetch('http://localhost:3000/api/tokens');
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }
    
    const tokens = await response.json();
    console.log(`📊 Encontrados ${tokens.length} tokens na API`);
    
    // Extrair símbolos e ordenar
    const symbols = tokens
      .map((token: any) => token.symbol)
      .sort()
      .filter((symbol: string) => symbol && symbol.length > 0);
    
    console.log(`✅ Símbolos extraídos: ${symbols.length}`);
    
    // Gerar o conteúdo do arquivo
    const fileContent = `// Lista de tokens válidos (gerada automaticamente da API)
// Última atualização: ${new Date().toISOString()}
export const VALID_TOKEN_SYMBOLS = [
${symbols.map((symbol: string) => `  '${symbol}'`).join(',\n')}
];

// Função para validar se um token é válido
export function isValidToken(symbol: string): boolean {
  return VALID_TOKEN_SYMBOLS.includes(symbol.toUpperCase());
}

// Função para validar uma lista de tokens
export function validateTokens(tokens: string[]): { valid: boolean; invalidTokens: string[] } {
  const invalidTokens = tokens.filter(token => !isValidToken(token));
  return {
    valid: invalidTokens.length === 0,
    invalidTokens
  };
}

// Função para obter todos os tokens válidos
export function getAllValidTokens(): string[] {
  return [...VALID_TOKEN_SYMBOLS];
}

// Função para verificar se a lista precisa ser atualizada
export function shouldUpdateTokenList(): boolean {
  // Implementar lógica para verificar se a lista está desatualizada
  // Por exemplo, verificar timestamp da última atualização
  return false;
}
`;
    
    // Caminho do arquivo
    const filePath = path.join(process.cwd(), 'src', 'lib', 'valid-tokens.ts');
    
    // Fazer backup do arquivo atual
    const backupPath = filePath + '.backup';
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
      console.log(`📋 Backup criado: ${backupPath}`);
    }
    
    // Escrever novo arquivo
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    console.log(`✅ Arquivo atualizado: ${filePath}`);
    console.log(`📊 Total de tokens válidos: ${symbols.length}`);
    
    // Verificar se ASTER está incluído
    if (symbols.includes('ASTER')) {
      console.log('🎯 ASTER agora está incluído na lista de tokens válidos!');
    } else {
      console.log('⚠️  ASTER não foi encontrado na API');
    }
    
    // Mostrar alguns tokens para verificação
    console.log('\n📋 Primeiros 10 tokens:');
    symbols.slice(0, 10).forEach((symbol: string) => {
      console.log(`  - ${symbol}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar tokens válidos:', error);
    process.exit(1);
  }
}

// Executar o script
updateValidTokens();