import { validateTokens } from '../src/lib/valid-tokens';

// Tokens visíveis na imagem do usuário
const userTokens = [
  'ZEC',    // Goleiro
  'AAVE',   // Zagueiro
  'ASTER',  // Zagueiro (este pode ser o problema!)
  'HYPE',   // Meio-campo
  'UNI',    // Meio-campo
  'ETH',    // Atacante
  'BTC',    // Atacante
  'SOL',    // Atacante
  'LINK',   // Atacante
  'BNB'     // Atacante
];

console.log('🔍 Testando tokens do usuário...');
console.log('Tokens selecionados:', userTokens);

const validation = validateTokens(userTokens);

console.log('\n📊 Resultado da validação:');
console.log('✅ Tokens válidos:', validation.valid);

if (!validation.valid) {
  console.log('❌ Tokens inválidos encontrados:', validation.invalidTokens);
  console.log('\n💡 Solução: Substitua os tokens inválidos por tokens válidos da lista.');
} else {
  console.log('✅ Todos os tokens são válidos!');
}

console.log('\n📋 Verificação individual:');
userTokens.forEach(token => {
  const isValid = validation.invalidTokens.includes(token) ? '❌' : '✅';
  console.log(`${isValid} ${token}`);
});