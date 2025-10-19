/**
 * Script para atualizar logos dos tokens com dados da CoinGecko
 *
 * Execute: npx tsx scripts/update-token-logos.ts
 */

import { PrismaClient } from '@prisma/client';
import { getCachedMarketTokens } from '../src/lib/cache/coingecko-cache';

const prisma = new PrismaClient();

async function updateTokenLogos() {
  try {
    console.log('🔄 Buscando dados da CoinGecko...\n');

    const { tokens: marketData } = await getCachedMarketTokens();
    console.log(`✅ ${marketData.length} tokens encontrados na CoinGecko\n`);

    console.log('📊 Atualizando logos dos times...\n');

    const teams = await prisma.team.findMany();
    let updatedCount = 0;

    for (const team of teams) {
      try {
        const tokens = JSON.parse(team.tokens);
        let hasChanges = false;

        const updatedTokens = tokens.map((token: any) => {
          const symbol = (token.symbol || '').toUpperCase();
          const marketToken = marketData.find(
            t => t.symbol?.toUpperCase() === symbol
          );

          if (marketToken && marketToken.logoUrl) {
            console.log(`  ✓ ${symbol}: ${marketToken.logoUrl}`);
            hasChanges = true;
            return {
              ...token,
              name: marketToken.name,
              logoUrl: marketToken.logoUrl,
            };
          }

          return token;
        });

        if (hasChanges) {
          await prisma.team.update({
            where: { id: team.id },
            data: { tokens: JSON.stringify(updatedTokens) },
          });
          updatedCount++;
          console.log(`  ✅ ${team.teamName} atualizado\n`);
        }
      } catch (err) {
        console.error(`  ❌ Erro ao atualizar ${team.teamName}:`, err);
      }
    }

    console.log(`\n✨ ${updatedCount} time(s) atualizado(s) com sucesso!\n`);

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateTokenLogos()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
