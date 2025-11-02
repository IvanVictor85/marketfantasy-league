/**
 * Script para identificar tokens escalados que não estão mais no top 100 da CoinGecko
 *
 * Uso: npx tsx scripts/check-deprecated-tokens.ts
 */

import { prisma } from '../src/lib/prisma';

interface TokenInfo {
  symbol: string;
  count: number;
  teams: string[];
}

async function checkDeprecatedTokens() {
  console.log('🔍 Verificando tokens escalados que não estão no top 100...\n');

  try {
    // Buscar todos os times
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        teamName: true,
        tokens: true,
        userWallet: true
      }
    });

    console.log(`📊 Total de times encontrados: ${teams.length}\n`);

    // Coletar todos os tokens únicos dos times
    const tokenMap = new Map<string, TokenInfo>();

    for (const team of teams) {
      try {
        const tokens = JSON.parse(team.tokens) as string[];

        for (const symbol of tokens) {
          const upperSymbol = symbol.toUpperCase();

          if (tokenMap.has(upperSymbol)) {
            const info = tokenMap.get(upperSymbol)!;
            info.count++;
            info.teams.push(team.teamName);
          } else {
            tokenMap.set(upperSymbol, {
              symbol: upperSymbol,
              count: 1,
              teams: [team.teamName]
            });
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao parsear tokens do time ${team.teamName}:`, error);
      }
    }

    console.log(`💎 Total de tokens únicos escalados: ${tokenMap.size}\n`);

    // Buscar top 100 da CoinGecko
    console.log('🌐 Buscando top 100 tokens da CoinGecko...\n');

    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MFL-Script/1.0',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na API CoinGecko: ${response.status}`);
    }

    const coingeckoTokens = await response.json();
    const top100Symbols = new Set(
      coingeckoTokens.map((token: any) => token.symbol.toUpperCase())
    );

    console.log(`✅ Top 100 tokens obtidos da CoinGecko\n`);

    // Identificar tokens que não estão no top 100
    const deprecatedTokens: TokenInfo[] = [];

    for (const [symbol, info] of tokenMap.entries()) {
      if (!top100Symbols.has(symbol)) {
        deprecatedTokens.push(info);
      }
    }

    // Ordenar por quantidade de times (do maior para o menor)
    deprecatedTokens.sort((a, b) => b.count - a.count);

    // Exibir resultados
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 TOKENS FORA DO TOP 100 DA COINGECKO');
    console.log('═══════════════════════════════════════════════════════\n');

    if (deprecatedTokens.length === 0) {
      console.log('✅ Todos os tokens escalados estão no top 100!\n');
    } else {
      console.log(`⚠️  Total de tokens fora do top 100: ${deprecatedTokens.length}\n`);

      deprecatedTokens.forEach((token, index) => {
        console.log(`${index + 1}. ${token.symbol}`);
        console.log(`   📊 Usado em ${token.count} time(s)`);
        console.log(`   👥 Times: ${token.teams.slice(0, 3).join(', ')}${token.teams.length > 3 ? ` + ${token.teams.length - 3} outros` : ''}`);
        console.log('');
      });

      // Resumo
      console.log('═══════════════════════════════════════════════════════');
      console.log('📊 RESUMO');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Total de tokens fora do top 100: ${deprecatedTokens.length}`);
      console.log(`Total de times afetados: ${new Set(deprecatedTokens.flatMap(t => t.teams)).size}`);

      const totalUsages = deprecatedTokens.reduce((sum, t) => sum + t.count, 0);
      console.log(`Total de escalações afetadas: ${totalUsages}`);
      console.log('');

      // Lista simples para copiar
      console.log('═══════════════════════════════════════════════════════');
      console.log('📝 LISTA DE SÍMBOLOS (copiar/colar)');
      console.log('═══════════════════════════════════════════════════════');
      console.log(deprecatedTokens.map(t => t.symbol).join(', '));
      console.log('');
    }

    // Estatísticas adicionais
    console.log('═══════════════════════════════════════════════════════');
    console.log('📈 ESTATÍSTICAS GERAIS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total de tokens únicos escalados: ${tokenMap.size}`);
    console.log(`Tokens no top 100: ${tokenMap.size - deprecatedTokens.length}`);
    console.log(`Tokens fora do top 100: ${deprecatedTokens.length}`);
    console.log(`Taxa de cobertura: ${((1 - deprecatedTokens.length / tokenMap.size) * 100).toFixed(2)}%`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao verificar tokens:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
checkDeprecatedTokens()
  .then(() => {
    console.log('✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
