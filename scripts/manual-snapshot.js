/**
 * 🎯 SCRIPT: Snapshot Manual para Rodadas de Teste
 *
 * Permite executar snapshots iniciais e finais manualmente,
 * útil para testar o sistema antes de rodar os crons oficiais.
 *
 * Uso:
 *   node scripts/manual-snapshot.js <competitionId> <tipo>
 *
 * Exemplos:
 *   node scripts/manual-snapshot.js cmicalugq000210ou5ri start
 *   node scripts/manual-snapshot.js cmicalugq000210ou5ri end
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Argumentos da linha de comando
const competitionId = process.argv[2];
const snapshotType = process.argv[3]; // 'start' ou 'end'

async function main() {
  console.log('📸 ========================================');
  console.log('📸 SNAPSHOT MANUAL - RODADA DE TESTE');
  console.log('📸 ========================================\n');

  // Validar argumentos
  if (!competitionId) {
    console.log('❌ Erro: ID da competição não fornecido\n');
    console.log('📋 Uso: node scripts/manual-snapshot.js <competitionId> <tipo>\n');
    console.log('📋 Tipos disponíveis:');
    console.log('   - start: Snapshot inicial (captura preços de início)');
    console.log('   - end: Snapshot final (calcula pontuações e define vencedores)\n');

    // Listar rodadas disponíveis
    console.log('📋 Rodadas disponíveis:\n');
    const competitions = await prisma.competition.findMany({
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        _count: { select: { userTeams: true } }
      }
    });

    competitions.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name || `Rodada ${i + 1}`}`);
      console.log(`   ID: ${c.id}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Times: ${c._count.userTeams}`);
      console.log('');
    });

    process.exit(1);
  }

  if (!snapshotType || !['start', 'end'].includes(snapshotType)) {
    console.log('❌ Erro: Tipo de snapshot inválido\n');
    console.log('Tipos válidos: start, end\n');
    process.exit(1);
  }

  // Buscar a competição
  console.log(`🔍 Buscando competição: ${competitionId}...\n`);

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      league: { select: { name: true } },
      _count: { select: { userTeams: true, competitionTokens: true } }
    }
  });

  if (!competition) {
    console.log('❌ Competição não encontrada!\n');
    process.exit(1);
  }

  console.log('✅ Competição encontrada:');
  console.log(`   Liga: ${competition.league.name}`);
  console.log(`   Nome: ${competition.name || 'N/A'}`);
  console.log(`   Status: ${competition.status}`);
  console.log(`   Times: ${competition._count.userTeams}`);
  console.log(`   Tokens: ${competition._count.competitionTokens}`);
  console.log(`   Início: ${competition.startDate.toISOString()}`);
  console.log(`   Fim: ${competition.endDate.toISOString()}`);
  console.log('');

  // Validar status da competição
  if (snapshotType === 'start') {
    if (competition.status !== 'PENDING') {
      console.log(`⚠️  AVISO: Competição está como ${competition.status}, mas você está tentando fazer snapshot inicial.`);
      console.log('   Snapshot inicial normalmente só é executado em competições PENDING.\n');
    }
  } else if (snapshotType === 'end') {
    if (competition.status !== 'ACTIVE') {
      console.log(`⚠️  AVISO: Competição está como ${competition.status}, mas você está tentando fazer snapshot final.`);
      console.log('   Snapshot final normalmente só é executado em competições ACTIVE.\n');
    }
  }

  // Executar snapshot
  console.log(`📸 Executando snapshot ${snapshotType.toUpperCase()}...\n`);

  const endpoint = snapshotType === 'start'
    ? '/api/competition/start'
    : '/api/competition/end';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${appUrl}${endpoint}`;

  console.log(`🌐 URL: ${url}`);
  console.log(`📦 Payload: { competitionId: "${competitionId}", skipTimeValidation: true }\n`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        competitionId,
        skipTimeValidation: true  // ✅ Pular validação de horário para testes
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ ========================================');
      console.log('✅ SNAPSHOT EXECUTADO COM SUCESSO');
      console.log('✅ ========================================\n');

      if (snapshotType === 'start') {
        console.log('📊 Snapshot Inicial:');
        console.log(`   Status: ${data.competition?.status || 'N/A'}`);
        console.log(`   Tokens capturados: ${data.snapshot?.tokensCount || 0}`);
        if (data.snapshot?.sample) {
          console.log(`   Amostra de preços:`);
          data.snapshot.sample.forEach((token) => {
            console.log(`      ${token.symbol}: $${token.price}`);
          });
        }
      } else if (snapshotType === 'end') {
        console.log('📊 Snapshot Final:');
        console.log(`   Status: ${data.competition?.status || 'N/A'}`);
        console.log(`   Times avaliados: ${data.scores?.teamsScored || 0}`);
        console.log(`   Vencedores: ${data.winners?.length || 0}`);
        if (data.winners && data.winners.length > 0) {
          console.log('\n🏆 TOP 3:');
          data.winners.forEach((winner) => {
            console.log(`   ${winner.position}º - ${winner.teamName}`);
            console.log(`      Jogador: ${winner.username || winner.userEmail}`);
            console.log(`      Score: ${winner.totalScore}%`);
            console.log(`      Prêmio: ${winner.prize} SOL`);
          });
        }
        if (data.nextCompetition) {
          console.log('\n📅 Próxima rodada criada:');
          console.log(`   ID: ${data.nextCompetition.id}`);
          console.log(`   Status: ${data.nextCompetition.status}`);
        }
      }

      console.log('');

    } else {
      console.log('❌ ========================================');
      console.log('❌ ERRO AO EXECUTAR SNAPSHOT');
      console.log('❌ ========================================\n');
      console.log(`Status: ${response.status}`);
      console.log(`Erro: ${data.error || 'Erro desconhecido'}`);
      if (data.details) {
        console.log(`Detalhes: ${data.details}`);
      }
      console.log('');
      process.exit(1);
    }

  } catch (error) {
    console.log('❌ ========================================');
    console.log('❌ ERRO DE CONEXÃO');
    console.log('❌ ========================================\n');
    console.error('Erro:', error.message);
    console.log('\n⚠️  Verifique se o servidor está rodando (npm run dev)\n');
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
