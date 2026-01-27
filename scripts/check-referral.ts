/**
 * Script para verificar informações de referral de um usuário
 * 
 * Uso: npx tsx scripts/check-referral.ts codigo_referral
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReferral(code: string) {
  console.log(`🔍 Verificando código de referral: ${code}\n`);

  // Buscar o referenciador
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code.toUpperCase() },
    include: {
      referrals: {
        include: {
          referralPoints: true
        }
      },
      referralPoints: true
    }
  });

  if (!referrer) {
    console.log('❌ Código de referral não encontrado\n');
    return;
  }

  console.log(`📊 Referenciador:`);
  console.log(`   ID: ${referrer.id}`);
  console.log(`   Email: ${referrer.email || 'N/A'}`);
  console.log(`   Nome: ${referrer.name}`);
  console.log(`   Username: ${referrer.username || 'N/A'}`);
  console.log(`   Carteira: ${referrer.publicKey || 'Sem carteira'}`);
  console.log(`   Código: ${referrer.referralCode}`);

  if (referrer.referralPoints) {
    console.log(`\n💰 Pontos de Referral:`);
    console.log(`   Total: ${referrer.referralPoints.totalPoints}`);
    console.log(`   Tier: ${referrer.referralPoints.tier}`);
    console.log(`   Total Indicações: ${referrer.referralPoints.totalReferrals}`);
    console.log(`   Indicações Ativas: ${referrer.referralPoints.activeReferrals}`);
  }

  console.log(`\n👥 Usuários Indicados (${referrer.referrals.length}):`);
  
  if (referrer.referrals.length === 0) {
    console.log('   Nenhum usuário indicado ainda');
  } else {
    for (const referred of referrer.referrals) {
      console.log(`\n   ${referred.name} (${referred.email || 'sem email'}):`);
      console.log(`     ID: ${referred.id}`);
      console.log(`     Carteira: ${referred.publicKey || '❌ SEM CARTEIRA'}`);
      console.log(`     Username: ${referred.username || 'N/A'}`);
      console.log(`     Criado em: ${referred.createdAt.toLocaleString('pt-BR')}`);
    }
  }

  console.log('\n');
}

// Executar
const code = process.argv[2];

if (!code) {
  console.error('❌ Erro: Forneça um código de referral como argumento');
  console.log('   Uso: npx tsx scripts/check-referral.ts TOKEQ7X7');
  process.exit(1);
}

checkReferral(code)
  .then(() => {
    console.log('✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao verificar referral:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
