import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function normalizeTokens() {
  console.log('🔄 Iniciando normalização de tokens...\n');

  const teams = await prisma.team.findMany();

  if (teams.length === 0) {
    console.log('⚠️  Nenhum time encontrado no banco de dados.');
    return;
  }

  console.log(`📊 Encontrados ${teams.length} times para normalizar.\n`);

  let normalized = 0;
  let alreadyNormalized = 0;
  let errors = 0;

  for (const team of teams) {
    try {
      let tokens = JSON.parse(team.tokens);

      // Verificar se já está normalizado (array de strings)
      if (tokens.length === 0 || typeof tokens[0] === 'string') {
        alreadyNormalized++;
        console.log(`✓ ${team.teamName}: Já normalizado - ${tokens.join(', ')}`);
        continue;
      }

      // Se for array de objetos, extrair apenas símbolos
      if (typeof tokens[0] === 'object') {
        const originalTokens = [...tokens];
        tokens = tokens.map((t: any) => t.symbol || t);

        // Salvar apenas array de strings
        await prisma.team.update({
          where: { id: team.id },
          data: { tokens: JSON.stringify(tokens) }
        });

        normalized++;
        console.log(`✅ ${team.teamName}: ${originalTokens.length} objetos → ${tokens.join(', ')}`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Erro ao normalizar time ${team.teamName}:`, error);
    }
  }

  console.log('\n📈 RESUMO:');
  console.log(`  ✅ Normalizados: ${normalized}`);
  console.log(`  ✓ Já estavam corretos: ${alreadyNormalized}`);
  console.log(`  ❌ Erros: ${errors}`);
  console.log(`  📊 Total: ${teams.length}`);

  if (normalized > 0) {
    console.log('\n🎉 Normalização concluída com sucesso!');
  } else {
    console.log('\n✓ Todos os times já estavam no formato correto.');
  }
}

normalizeTokens()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    prisma.$disconnect();
    process.exit(1);
  });
