/**
 * Verifica se os dados do snapshot foram salvos corretamente
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const competitionId = 'cmicalugq000210ou5ri809wa'; // Rodada 2

  console.log('\n🔍 VERIFICANDO DADOS DO SNAPSHOT\n');

  // Buscar competição
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      competitionTokens: true,
      userTeams: {
        include: {
          user: { select: { username: true, email: true } }
        }
      }
    }
  });

  if (!competition) {
    console.log('❌ Competição não encontrada');
    return;
  }

  console.log('📊 COMPETIÇÃO:');
  console.log(`   Status: ${competition.status}`);
  console.log(`   Times: ${competition.userTeams.length}`);
  console.log(`   Tokens no cardápio: ${competition.competitionTokens.length}\n`);

  console.log('💰 PREÇOS INICIAIS (priceStart):\n');

  let tokensComPreco = 0;
  let tokensSemPreco = 0;

  competition.competitionTokens.forEach(ct => {
    const hasPrice = ct.priceStart && Number(ct.priceStart) > 0;

    if (hasPrice) {
      tokensComPreco++;
      console.log(`   ✅ ${ct.symbol.padEnd(6)} $${Number(ct.priceStart).toFixed(2)}`);
    } else {
      tokensSemPreco++;
      console.log(`   ❌ ${ct.symbol.padEnd(6)} SEM PREÇO`);
    }
  });

  console.log(`\n📊 RESUMO:`);
  console.log(`   Tokens com preço: ${tokensComPreco}`);
  console.log(`   Tokens sem preço: ${tokensSemPreco}`);

  if (tokensSemPreco > 0) {
    console.log('\n⚠️  PROBLEMA: Alguns tokens não têm preço inicial!');
    console.log('   Isso vai fazer os pontos ficarem zerados.\n');
  } else {
    console.log('\n✅ Todos os tokens têm preço inicial!\n');
  }

  // Verificar um time de exemplo
  const sampleTeam = competition.userTeams[0];
  if (sampleTeam) {
    console.log('🎯 EXEMPLO DE TIME:\n');
    console.log(`   Nome: ${sampleTeam.teamName}`);
    console.log(`   Jogador: ${sampleTeam.user.username || sampleTeam.user.email}`);
    console.log(`   Tokens: ${sampleTeam.players.join(', ')}`);
    console.log('');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
