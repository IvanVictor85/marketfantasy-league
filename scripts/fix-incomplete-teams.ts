import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixIncompleteTeams() {
  console.log('🔧 Corrigindo times incompletos...\n');

  try {
    const teams = await prisma.team.findMany();

    if (teams.length === 0) {
      console.log('⚠️  Nenhum time encontrado no banco.');
      return;
    }

    console.log(`📊 Verificando ${teams.length} times...\n`);

    // Tokens padrão para completar (top 10 do mercado)
    const defaultTokens = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'AVAX', 'MATIC', 'LINK', 'DOGE', 'SHIB'];

    let fixed = 0;
    let alreadyComplete = 0;
    let errors = 0;

    for (const team of teams) {
      try {
        let tokens = JSON.parse(team.tokens);

        // Verificar se tem menos de 10 tokens
        if (tokens.length < 10) {
          console.log(`⚠️  ${team.teamName}: apenas ${tokens.length} tokens - ${tokens.join(', ')}`);

          // Pegar tokens que faltam dos defaults (que não estão no time)
          const missing = defaultTokens.filter(t => !tokens.includes(t));

          // Completar até 10
          while (tokens.length < 10 && missing.length > 0) {
            tokens.push(missing.shift());
          }

          // Se ainda não tem 10 (improvável, mas seguro)
          if (tokens.length < 10) {
            console.warn(`  ⚠️  Não foi possível completar ${team.teamName} - faltam tokens padrão`);
            continue;
          }

          // Atualizar no banco
          await prisma.team.update({
            where: { id: team.id },
            data: { tokens: JSON.stringify(tokens) }
          });

          fixed++;
          console.log(`  ✅ Completado para 10 tokens: ${tokens.join(', ')}\n`);

        } else if (tokens.length === 10) {
          alreadyComplete++;
          console.log(`✓ ${team.teamName}: já tem 10 tokens - ${tokens.join(', ')}`);

        } else if (tokens.length > 10) {
          // Caso tenha mais de 10, truncar
          console.log(`⚠️  ${team.teamName}: tem ${tokens.length} tokens (mais que 10!)`);
          tokens = tokens.slice(0, 10);

          await prisma.team.update({
            where: { id: team.id },
            data: { tokens: JSON.stringify(tokens) }
          });

          fixed++;
          console.log(`  ✅ Truncado para 10 tokens: ${tokens.join(', ')}\n`);
        }

      } catch (error) {
        errors++;
        console.error(`❌ Erro ao processar time ${team.teamName}:`, error);
      }
    }

    console.log('\n📈 RESUMO:');
    console.log(`  ✅ Corrigidos: ${fixed}`);
    console.log(`  ✓ Já completos: ${alreadyComplete}`);
    console.log(`  ❌ Erros: ${errors}`);
    console.log(`  📊 Total: ${teams.length}`);

    if (fixed > 0) {
      console.log('\n🎉 Correção concluída com sucesso!');
    } else if (errors === 0) {
      console.log('\n✓ Todos os times já estavam completos.');
    }

  } catch (error) {
    console.error('💥 Erro ao corrigir times:', error);
  }
}

fixIncompleteTeams()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    prisma.$disconnect();
    process.exit(1);
  });
