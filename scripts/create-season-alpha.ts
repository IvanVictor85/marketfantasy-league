import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSeasonAlpha() {
  console.log('🚀 Criando Season Alpha...\n');

  // 1. Desativar temporadas anteriores
  const { error: updateError } = await supabase
    .from('seasons')
    .update({ status: 'COMPLETED' })
    .eq('status', 'ACTIVE');

  if (updateError) {
    console.log('⚠️ Aviso ao desativar temporadas:', updateError.message);
  }

  // 2. Criar Season Alpha
  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .insert({
      name: 'Season Alpha',
      start_date: '2026-02-23T00:00:00+00:00', // 22/02 21h BR
      end_date: '2026-03-21T00:00:00+00:00',   // 20/03 21h BR
      status: 'ACTIVE',
    })
    .select()
    .single();

  if (seasonError) {
    console.error('❌ Erro ao criar season:', seasonError);
    return;
  }

  console.log('✅ Season Alpha criada:', season);

  // 3. Criar as 4 rodadas
  const rounds = [
    {
      season_id: season.id,
      round_number: 1,
      name: 'Rodada 1',
      start_time: '2026-02-23T00:00:00+00:00', // Dom 22/02 21h BR
      end_time: '2026-02-28T00:00:00+00:00',   // Sex 27/02 21h BR
      entry_fee: 0.025,
      prize_pool: 0,
      status: 'PENDING',
    },
    {
      season_id: season.id,
      round_number: 2,
      name: 'Rodada 2',
      start_time: '2026-03-02T00:00:00+00:00', // Dom 01/03 21h BR
      end_time: '2026-03-07T00:00:00+00:00',   // Sex 06/03 21h BR
      entry_fee: 0.025,
      prize_pool: 0,
      status: 'PENDING',
    },
    {
      season_id: season.id,
      round_number: 3,
      name: 'Rodada 3',
      start_time: '2026-03-09T00:00:00+00:00', // Dom 08/03 21h BR
      end_time: '2026-03-14T00:00:00+00:00',   // Sex 13/03 21h BR
      entry_fee: 0.025,
      prize_pool: 0,
      status: 'PENDING',
    },
    {
      season_id: season.id,
      round_number: 4,
      name: 'Rodada 4',
      start_time: '2026-03-16T00:00:00+00:00', // Dom 15/03 21h BR
      end_time: '2026-03-21T00:00:00+00:00',   // Sex 20/03 21h BR
      entry_fee: 0.025,
      prize_pool: 0,
      status: 'PENDING',
    },
  ];

  const { data: createdRounds, error: roundsError } = await supabase
    .from('rounds')
    .insert(rounds)
    .select();

  if (roundsError) {
    console.error('❌ Erro ao criar rodadas:', roundsError);
    return;
  }

  console.log('\n✅ Rodadas criadas:');
  createdRounds.forEach((r) => {
    const startBR = new Date(r.start_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const endBR = new Date(r.end_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`   ${r.name}: ${startBR} até ${endBR}`);
  });

  console.log('\n🎉 Season Alpha criada com sucesso!');
  console.log('\n📋 Resumo:');
  console.log('   Temporada: Season Alpha');
  console.log('   Rodadas: 4');
  console.log('   Taxa de entrada: 0.025 SOL');
  console.log('   Período: 22/02 a 20/03/2026');
}

createSeasonAlpha().catch(console.error);
