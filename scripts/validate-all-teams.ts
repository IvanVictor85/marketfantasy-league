import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateAllTeams() {
  console.log('🔍 Validando formato de tokens em todos os times...\n');

  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        teamName: true,
        tokens: true,
        userWallet: true
      }
    });

    if (teams.length === 0) {
      console.log('⚠️  Nenhum time encontrado no banco.');
      return;
    }

    console.log(`📊 Validando ${teams.length} times...\n`);

    let valid = 0;
    let invalid = 0;

    for (const team of teams) {
      try {
        const tokens = JSON.parse(team.tokens);

        // Validar formato
        const isArray = Array.isArray(tokens);
        const allStrings = isArray && tokens.every(t => typeof t === 'string');
        const has10Tokens = isArray && tokens.length === 10;

        if (isArray && allStrings && has10Tokens) {
          valid++;
          console.log(`✅ ${team.teamName}: ${tokens.join(', ')}`);
        } else {
          invalid++;
          console.log(`❌ ${team.teamName}:`);
          console.log(`   - É array? ${isArray}`);
          console.log(`   - Todos strings? ${allStrings}`);
          console.log(`   - Tem 10 tokens? ${has10Tokens}`);
          console.log(`   - Dados:`, tokens);
        }
      } catch (error) {
        invalid++;
        console.error(`❌ ${team.teamName}: Erro ao fazer parse -`, error);
      }
    }

    console.log('\n📈 RESULTADO DA VALIDAÇÃO:');
    console.log(`  ✅ Válidos: ${valid}`);
    console.log(`  ❌ Inválidos: ${invalid}`);
    console.log(`  📊 Total: ${teams.length}`);

    if (invalid === 0) {
      console.log('\n🎉 Todos os times estão no formato correto!');
      console.log('✨ Padrão: ["BTC", "ETH", "SOL", ...]');
    } else {
      console.log('\n⚠️  Alguns times precisam de correção.');
      console.log('Execute: npx tsx scripts/normalize-team-tokens.ts');
    }

  } catch (error) {
    console.error('💥 Erro ao validar times:', error);
  }
}

validateAllTeams()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    prisma.$disconnect();
    process.exit(1);
  });
