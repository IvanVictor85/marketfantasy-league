/**
 * Script para deletar usuário e todos os dados relacionados
 * 
 * Uso: npx tsx scripts/delete-user.ts ivanvoliveira@gmail.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser(email: string) {
  console.log(`🔍 Buscando usuário: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      authTokens: true,
      userTeams: true,
      seasonRankings: true,
      leagueEntries: true,
      prizeClaims: true,
      legacyTeams: true,
      referralPoints: true,
      pointLogs: true,
      referrals: true, // Usuários que este indicou
    }
  });

  if (!user) {
    console.log('❌ Usuário não encontrado');
    return;
  }

  console.log(`\n📊 Usuário encontrado:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Nome: ${user.name}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   PublicKey: ${user.publicKey || 'N/A'}`);
  console.log(`   Referral Code: ${user.referralCode || 'N/A'}`);
  console.log(`   Referido por: ${user.referredById || 'N/A'}`);

  console.log(`\n🗑️  Dados a serem deletados:`);
  console.log(`   - ${user.authTokens.length} tokens de autenticação`);
  console.log(`   - ${user.userTeams.length} times de usuário`);
  console.log(`   - ${user.seasonRankings.length} rankings de temporada`);
  console.log(`   - ${user.leagueEntries.length} entradas em ligas`);
  console.log(`   - ${user.prizeClaims.length} reivindicações de prêmios`);
  console.log(`   - ${user.legacyTeams.length} times legados`);
  console.log(`   - ${user.referralPoints ? '1' : '0'} registro de pontos de referral`);
  console.log(`   - ${user.pointLogs.length} logs de pontos`);
  console.log(`   - ${user.referrals.length} usuários indicados`);

  console.log(`\n⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!`);
  console.log(`⚠️  Todos os dados relacionados serão permanentemente deletados.`);

  // Deletar em ordem (relações primeiro)
  console.log(`\n🗑️  Iniciando deleção...`);

  // 1. Deletar códigos de verificação pendentes
  try {
    await prisma.verificationCode.deleteMany({
      where: { email }
    });
    console.log(`✅ Códigos de verificação deletados`);
  } catch (error) {
    console.log(`⚠️  Nenhum código de verificação encontrado`);
  }

  // 2. Remover referência de usuários indicados (antes de deletar o usuário)
  if (user.referrals.length > 0) {
    await prisma.user.updateMany({
      where: { referredById: user.id },
      data: { referredById: null }
    });
    console.log(`✅ Referência de indicados removida (${user.referrals.length} usuários)`);
  }

  // 3. Deletar point logs de outros usuários que referenciam este
  const otherPointLogs = await prisma.pointLog.deleteMany({
    where: { referredUserId: user.id }
  });
  if (otherPointLogs.count > 0) {
    console.log(`✅ Logs de pontos de outros usuários deletados (${otherPointLogs.count})`);
  }

  // 4. Deletar usuário (cascata deleta o resto)
  await prisma.user.delete({
    where: { id: user.id }
  });

  console.log(`\n✅ Usuário ${email} deletado com sucesso!`);
  console.log(`✅ Todos os dados relacionados foram removidos.`);
}

// Executar
const email = process.argv[2];

if (!email) {
  console.error('❌ Erro: Forneça um email como argumento');
  console.log('   Uso: npx tsx scripts/delete-user.ts usuario@email.com');
  process.exit(1);
}

deleteUser(email)
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao deletar usuário:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
