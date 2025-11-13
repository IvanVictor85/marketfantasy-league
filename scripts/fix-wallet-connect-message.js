const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src/app/api/wallet/connect/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Encontrar e corrigir a função createSignInMessage
const incorrectFunction = `function createSignInMessage(nonce: string, walletAddress: string): Uint8Array {
  const message = ;

  return new TextEncoder().encode(message);
}`;

const correctFunction = `function createSignInMessage(nonce: string, walletAddress: string): Uint8Array {
  const message = \`Bem-vindo ao MFL!

Clique para assinar e provar que você é o dono desta carteira.

Isso não custará nenhum SOL.

ID de Desafio (Nonce): \${nonce}
Carteira: \${walletAddress}\`;

  return new TextEncoder().encode(message);
}`;

content = content.replace(incorrectFunction, correctFunction);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Mensagem da função createSignInMessage corrigida!');
