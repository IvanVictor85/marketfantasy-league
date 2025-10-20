#!/usr/bin/env tsx

console.log('🔍 Verificando variáveis de ambiente...\n');
console.log('=' .repeat(70));

const requiredVars = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'HELIUS_API_KEY': process.env.HELIUS_API_KEY,
  'NEXT_PUBLIC_HELIUS_API_KEY': process.env.NEXT_PUBLIC_HELIUS_API_KEY,
  'NEXT_PUBLIC_SOLANA_NETWORK': process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  'NEXT_PUBLIC_SOLANA_RPC_URL': process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  'EMAIL_USER': process.env.EMAIL_USER,
  'EMAIL_PASSWORD': process.env.EMAIL_PASSWORD,
  'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
  'NEXT_PUBLIC_PROGRAM_ID': process.env.NEXT_PUBLIC_PROGRAM_ID
};

let allOk = true;
let criticalMissing: string[] = [];
let optionalMissing: string[] = [];

// Variáveis críticas (sistema não funciona sem elas)
const criticalVars = ['DATABASE_URL', 'NEXT_PUBLIC_SOLANA_NETWORK'];

for (const [key, value] of Object.entries(requiredVars)) {
  const isCritical = criticalVars.includes(key);

  if (value && value !== 'your_key_here' && value !== 'your_api_key_here') {
    const preview = value.length > 40 ? value.substring(0, 40) + '...' : value;
    console.log(`✅ ${key.padEnd(35)} ${preview}`);
  } else {
    if (isCritical) {
      console.log(`❌ ${key.padEnd(35)} NÃO CONFIGURADA (CRÍTICO!)`);
      criticalMissing.push(key);
      allOk = false;
    } else {
      console.log(`⚠️  ${key.padEnd(35)} NÃO CONFIGURADA (opcional)`);
      optionalMissing.push(key);
    }
  }
}

console.log('=' .repeat(70));

if (allOk && optionalMissing.length === 0) {
  console.log('\n✅ Todas as variáveis configuradas!\n');
  console.log('🚀 Sistema pronto para uso em produção!');
} else if (allOk) {
  console.log('\n✅ Variáveis críticas OK!\n');
  console.log('⚠️  Variáveis opcionais faltando:');
  optionalMissing.forEach(key => console.log(`   - ${key}`));
  console.log('\n💡 Sistema funcionará, mas alguns recursos podem estar limitados.');
} else {
  console.log('\n❌ Variáveis CRÍTICAS faltando:\n');
  criticalMissing.forEach(key => console.log(`   ⛔ ${key}`));

  if (optionalMissing.length > 0) {
    console.log('\n⚠️  Variáveis opcionais faltando:');
    optionalMissing.forEach(key => console.log(`   - ${key}`));
  }

  console.log('\n🛑 Sistema NÃO funcionará sem as variáveis críticas!');
  console.log('\n📝 Ações necessárias:');
  console.log('   1. Copie .env.example para .env');
  console.log('   2. Preencha as variáveis faltantes');
  console.log('   3. Reinicie o servidor');

  process.exit(1);
}

// Verificar conexão com banco
console.log('\n🔍 Testando conexão com banco de dados...');

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexão com banco de dados OK!');

    // Testar query simples
    const userCount = await prisma.user.count();
    console.log(`✅ Banco acessível: ${userCount} usuário(s) cadastrado(s)`);

  } catch (error: any) {
    console.error('❌ Erro ao conectar com banco:', error.message);
    console.log('\n💡 Verifique:');
    console.log('   - DATABASE_URL está correto?');
    console.log('   - Banco de dados está online?');
    console.log('   - Migrations foram executadas? (npx prisma migrate deploy)');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection().then(() => {
  console.log('\n🎉 Verificação completa!\n');
});
