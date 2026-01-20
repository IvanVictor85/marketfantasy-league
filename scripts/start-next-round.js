/**
 * Script: Iniciar Próxima Rodada (v3 - Tokens Suspensos + Primeira Rodada)
 *
 * Este script implementa a lógica de "Tokens Suspensos" com Top 100 dinâmico
 * e é capaz de criar a PRIMEIRA rodada se não existir nenhuma.
 *
 * O que faz:
 * 1. Procura a rodada ATIVA atual
 * 2. Se EXISTE rodada ATIVA:
 *    - Verifica se ela JÁ TERMINOU (endDate < agora)
 *    - Se sim, marca-a como COMPLETED
 * 3. Se NÃO EXISTE rodada ATIVA:
 *    - Busca a temporada mais recente
 *    - Cria a PRIMEIRA rodada da temporada
 * 4. Busca um NOVO Top 100 de tokens frescos do CoinGecko
 * 5. Cataloga todos os tokens na tabela Token (Foreign Key)
 * 6. Cria uma nova rodada ACTIVE com o cardápio atualizado
 *
 * Regras de Negócio:
 * - Se houver rodada ATIVA, só roda se ela tiver endDate no passado
 * - Se NÃO houver rodada ATIVA, cria a primeira
 * - NÃO copia tokens antigos (sempre busca Top 100 fresco)
 * - Tokens que saírem do Top 100 ficam "suspensos" na próxima rodada
 *
 * Como executar:
 * node scripts/start-next-round.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Busca Top 100 tokens diretamente da API CoinGecko
 * (Replica a lógica de getTop100Tokens do coingecko.service.ts)
 */
async function getTop100Tokens() {
  console.log('🔍 CoinGecko: Buscando Top 100 tokens...');

  try {
    const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('order', 'market_cap_desc');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', '1');
    url.searchParams.set('price_change_percentage', '1h,24h,7d,30d');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MFL-Platform/1.0',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [COINGECKO_TOP100_ERROR_${response.status}]`, {
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        responseBody: errorText.substring(0, 200)
      });
      throw new Error(`CoinGecko API error (Top100): ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();

    console.log(`✅ CoinGecko: Top ${data.length} tokens obtidos`);

    return data.map((token) => ({
      id: token.id,
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      image: token.image,
      current_price: token.current_price || 0,
      price_change_percentage_1h_in_currency: token.price_change_percentage_1h_in_currency,
      price_change_percentage_24h: token.price_change_percentage_24h,
      price_change_percentage_7d_in_currency: token.price_change_percentage_7d_in_currency,
      price_change_percentage_30d_in_currency: token.price_change_percentage_30d_in_currency,
      market_cap: token.market_cap || 0,
      total_volume: token.total_volume || 0,
      market_cap_rank: token.market_cap_rank,
    }));

  } catch (error) {
    console.error('❌ [COINGECKO_TOP100_CRASH] Erro ao buscar Top 100:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
}

/**
 * Calcula o próximo Domingo às 21:00 BRT (UTC-3)
 */
function getNextSunday21h() {
  const now = new Date();
  const nextSunday = new Date(now);
  const dayOfWeek = now.getDay(); // 0 = Domingo, 6 = Sábado

  // Se hoje é domingo e ainda não passou das 21h, usar hoje
  if (dayOfWeek === 0 && now.getHours() < 21) {
    nextSunday.setHours(21, 0, 0, 0);
  } else {
    // Calcular próximo domingo
    const daysUntilSunday = dayOfWeek === 0 ? 7 : (7 - dayOfWeek);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(21, 0, 0, 0);
  }

  return nextSunday;
}

async function startNextRound() {
  console.log('🚀 ========================================');
  console.log('🚀 INICIAR PRÓXIMA RODADA (v3 - Top 100 Dinâmico + Primeira Rodada)');
  console.log('🚀 ========================================\n');

  try {
    // ============================================
    // ETAPA 1: Buscar Liga Principal
    // ============================================
    console.log('📋 ETAPA 1: Buscando Liga Principal...');

    const mainLeague = await prisma.league.findFirst({
      where: {
        name: 'Liga Principal MarketFantasy'
      }
    });

    if (!mainLeague) {
      throw new Error('Liga Principal MarketFantasy não encontrada');
    }

    console.log(`✅ Liga encontrada: ${mainLeague.name} (${mainLeague.id})\n`);

    // ============================================
    // ETAPA 2: Buscar Rodada ATIVA
    // ============================================
    console.log('📋 ETAPA 2: Buscando rodada ATIVA...');

    const activeCompetition = await prisma.competition.findFirst({
      where: {
        leagueId: mainLeague.id,
        status: 'ACTIVE'
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // Variável para armazenar o ID da temporada (será usado na Etapa 7)
    let currentSeasonId = null;

    if (activeCompetition) {
      // ============================================
      // FLUXO NORMAL: Rodada ACTIVE existe
      // ============================================
      console.log(`✅ Rodada ATIVA encontrada: ${activeCompetition.id}`);
      console.log(`   Início: ${activeCompetition.startDate?.toISOString()}`);
      console.log(`   Fim: ${activeCompetition.endDate?.toISOString()}\n`);

      currentSeasonId = activeCompetition.seasonId; // Guardar ID da temporada

      // ============================================
      // ETAPA 3: ✅ VERIFICAR SE A RODADA TERMINOU
      // ============================================
      console.log('📋 ETAPA 3: Verificando se a rodada terminou...');

      const now = new Date();
      console.log(`⏰ Horário atual: ${now.toISOString()}`);

      if (!activeCompetition.endDate) {
        throw new Error('Rodada ATIVA não tem endDate definida');
      }

      if (activeCompetition.endDate > now) {
        console.log(`\n❌ A rodada ATIVA ainda não terminou!`);
        console.log(`   Termina em: ${activeCompetition.endDate.toISOString()}`);
        console.log(`   Tempo restante: ${Math.ceil((activeCompetition.endDate - now) / (1000 * 60 * 60))} horas`);
        console.log('\n⚠️ Script finalizado sem alterações.\n');
        return;
      }

      console.log(`✅ Rodada terminou em: ${activeCompetition.endDate.toISOString()}`);
      console.log(`   Tempo desde término: ${Math.ceil((now - activeCompetition.endDate) / (1000 * 60 * 60))} horas\n`);

      // ============================================
      // ETAPA 4: Marcar rodada como COMPLETED
      // ============================================
      console.log('📋 ETAPA 4: Finalizando rodada antiga...');

      await prisma.competition.update({
        where: { id: activeCompetition.id },
        data: { status: 'COMPLETED' }
      });

      console.log(`✅ Rodada ${activeCompetition.id} marcada como COMPLETED\n`);

    } else {
      // ============================================
      // FLUXO DE "PRIMEIRA RODADA": Não existe rodada ACTIVE
      // ============================================
      console.warn('⚠️ Nenhuma rodada ATIVA encontrada.');
      console.log('🆕 Modo: Criação da PRIMEIRA rodada (ou após hard reset)\n');

      // Buscar a temporada mais recente
      console.log('📋 ETAPA 3 (Alternativa): Buscando temporada mais recente...');
      const latestSeason = await prisma.season.findFirst({
        orderBy: { startDate: 'desc' }
      });

      if (!latestSeason) {
        throw new Error('❌ Nenhuma Temporada encontrada no banco. Crie uma temporada primeiro.');
      }

      currentSeasonId = latestSeason.id;
      console.log(`✅ Usando Temporada mais recente: ${latestSeason.name || latestSeason.id}`);
      console.log(`   ID: ${currentSeasonId}`);
      console.log(`   Início: ${latestSeason.startDate?.toISOString()}\n`);

      console.log('📋 ETAPA 4: (Pulada - não há rodada antiga para finalizar)\n');
    }

    // ============================================
    // ETAPA 5: ✅ BUSCAR TOP 100 TOKENS FRESCOS
    // ============================================
    console.log('📋 ETAPA 5: Buscando Top 100 tokens FRESCOS do CoinGecko...');

    const top100Tokens = await getTop100Tokens();

    if (!top100Tokens || top100Tokens.length === 0) {
      throw new Error('❌ Falha ao buscar Top 100 do CoinGecko. Nova rodada não pode ser criada.');
    }

    console.log(`✅ ${top100Tokens.length} tokens frescos (brutos) obtidos do CoinGecko`);
    console.log(`   Exemplos: ${top100Tokens.slice(0, 5).map(t => t.symbol).join(', ')}...\n`);

    // ============================================
    // ETAPA 5.5: ✅ DEDUPAR LISTA POR SÍMBOLO
    // ============================================
    console.log('📋 ETAPA 5.5: Dedupando lista de tokens por símbolo...');
    console.log('   (CoinGecko retorna múltiplos USDT, WBTC, etc. em diferentes chains)');

    const uniqueSymbols = new Set();
    const uniqueTokens = top100Tokens.filter(token => {
      const symbolUpper = token.symbol.toUpperCase();
      if (!uniqueSymbols.has(symbolUpper)) {
        uniqueSymbols.add(symbolUpper);
        return true; // Manter primeira ocorrência
      }
      return false; // Ignorar duplicatas
    });

    console.log(`✅ ${uniqueTokens.length} tokens únicos (por símbolo) encontrados`);
    console.log(`   Removidos: ${top100Tokens.length - uniqueTokens.length} token(s) duplicado(s)\n`);

    // ============================================
    // ETAPA 6: Calcular datas da nova rodada
    // ============================================
    console.log('📋 ETAPA 6: Calculando datas da nova rodada...');

    const newStartDate = getNextSunday21h();
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + 5); // Sexta, 5 dias depois

    console.log('📅 Nova rodada:');
    console.log(`   Início (Domingo 21h BRT): ${newStartDate.toISOString()}`);
    console.log(`   Fim (Sexta 21h BRT): ${newEndDate.toISOString()}\n`);

    // ============================================
    // ETAPA 7: Criar nova rodada ACTIVE
    // ============================================
    console.log('📋 ETAPA 7: Criando nova rodada ACTIVE...');

    const newCompetition = await prisma.competition.create({
      data: {
        name: `Rodada (Início ${newStartDate.toLocaleDateString('pt-BR')})`,
        leagueId: mainLeague.id,
        seasonId: currentSeasonId, // ✅ CORREÇÃO: Usar o ID da temporada que encontramos
        status: 'ACTIVE',
        startDate: newStartDate,
        endDate: newEndDate,
        prizePool: 0
      }
    });

    console.log(`✅ Nova rodada criada: ${newCompetition.id}`);
    console.log(`   Status: ${newCompetition.status}`);
    console.log(`   Nome: ${newCompetition.name}\n`);

    // ============================================
    // ETAPA 7.5: ✅ CATALOGAR TOKENS NO BANCO
    // ============================================
    console.log(`📋 ETAPA 7.5: Sincronizando catálogo principal de Tokens...`);
    console.log(`   Garantindo que todos os ${uniqueTokens.length} tokens existem na tabela Token...`);

    // ✅ CORREÇÃO: Usar lista dedupada e 'symbol' como chave única
    const upsertPromises = uniqueTokens.map(token => {
      const symbolUpper = token.symbol.toUpperCase();
      return prisma.token.upsert({
        where: { symbol: symbolUpper }, // ✅ CORREÇÃO: Usar 'symbol' como chave única
        update: {
          // Se 'BTC' já existe, apenas atualiza os dados
          name: token.name,
          coingeckoId: token.id, // Atualiza para o ID de maior market cap
          logoUrl: token.image,
        },
        create: {
          // Se 'BTC' não existe, cria-o
          coingeckoId: token.id,
          name: token.name,
          symbol: symbolUpper,
          logoUrl: token.image,
        }
      });
    });

    // Executar todos os upserts em paralelo
    const upsertedTokens = await Promise.all(upsertPromises);
    console.log(`✅ ${upsertedTokens.length} tokens sincronizados no catálogo principal`);

    // ✅ CORREÇÃO: Criar mapa usando 'symbol' como chave
    const symbolToCuidMap = new Map(
      upsertedTokens.map(t => [t.symbol, t.id])
    );
    console.log(`✅ Mapa de IDs criado (Símbolo → DB ID)\n`);

    // ============================================
    // ETAPA 8: ✅ POPULAR COM TOKENS FRESCOS
    // ============================================
    console.log(`📋 ETAPA 8: Populando nova rodada com ${uniqueTokens.length} tokens frescos...`);

    // ✅ CORREÇÃO: Usar lista dedupada e mapa de símbolos
    const tokensToCreate = uniqueTokens.map(token => {
      const symbolUpper = token.symbol.toUpperCase();
      return {
        competitionId: newCompetition.id,
        tokenId: symbolToCuidMap.get(symbolUpper), // ✅ CORREÇÃO: Usar CUID do mapa de símbolos
        symbol: symbolUpper,
        name: token.name,
        imageUrl: token.image,
        marketCapRank: token.market_cap_rank
      };
    });

    // Filtrar tokens que falharam no mapeamento (não deve acontecer, mas garantir)
    const validTokensToCreate = tokensToCreate.filter(t => t.tokenId);

    if (validTokensToCreate.length !== tokensToCreate.length) {
      console.warn(`⚠️ ${tokensToCreate.length - validTokensToCreate.length} token(s) sem ID válido (ignorados)`);
    }

    await prisma.competitionToken.createMany({
      data: validTokensToCreate,
      skipDuplicates: true
    });

    console.log(`✅ ${validTokensToCreate.length} tokens inseridos na nova rodada\n`);

    // ============================================
    // RESUMO FINAL
    // ============================================
    console.log('✅ ========================================');
    console.log('✅ PRÓXIMA RODADA INICIADA COM SUCESSO');
    console.log('✅ ========================================');
    console.log(`📊 Rodada Antiga: ${activeCompetition.id} (COMPLETED)`);
    console.log(`📊 Nova Rodada: ${newCompetition.id} (ACTIVE)`);
    console.log(`📊 Tokens Catalogados: ${upsertedTokens.length} (sincronizados na tabela Token)`);
    console.log(`📊 Tokens na Rodada: ${validTokensToCreate.length} (Top 100 fresco)`);
    console.log(`📊 Liga: ${mainLeague.name}`);
    console.log(`📊 Temporada: ${activeCompetition.seasonId}`);
    console.log('\n🎯 Sistema de Tokens Suspensos ATIVO:');
    console.log('   - Tokens que saírem do Top 100 ficarão ZERADOS na próxima rodada');
    console.log('   - Jogadores receberão aviso para substituir tokens suspensos');
    console.log('');

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ ERRO AO EXECUTAR SCRIPT');
    console.error('❌ ========================================');
    console.error(error);
    console.error('');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
startNextRound()
  .then(() => {
    console.log('✅ Script finalizado com sucesso\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  });
