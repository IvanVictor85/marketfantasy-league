-- =============================================
-- SEASON ALPHA - CryptoFantasy League
-- 4 Rodadas: 22/02 a 20/03/2026
-- Horário: Domingo 21h BR até Sexta 21h BR
-- =============================================

-- Desativar temporadas anteriores (opcional)
UPDATE seasons SET status = 'COMPLETED' WHERE status = 'ACTIVE';

-- 1. Criar a Season Alpha
INSERT INTO seasons (name, start_date, end_date, status, created_at, updated_at)
VALUES (
  'Season Alpha',
  '2026-02-23 00:00:00+00',
  '2026-03-21 00:00:00+00',
  'ACTIVE',
  NOW(),
  NOW()
);

-- 2. Criar as 4 rodadas
-- Rodada 1: 22/02 (Dom) 21h BR até 27/02 (Sex) 21h BR
INSERT INTO rounds (
  season_id, round_number, name, start_time, end_time,
  entry_fee, prize_pool, status, created_at, updated_at
)
SELECT id, 1, 'Rodada 1',
  '2026-02-23 00:00:00+00', '2026-02-28 00:00:00+00',
  0.025, 0, 'PENDING', NOW(), NOW()
FROM seasons WHERE name = 'Season Alpha';

-- Rodada 2: 01/03 (Dom) 21h BR até 06/03 (Sex) 21h BR
INSERT INTO rounds (
  season_id, round_number, name, start_time, end_time,
  entry_fee, prize_pool, status, created_at, updated_at
)
SELECT id, 2, 'Rodada 2',
  '2026-03-02 00:00:00+00', '2026-03-07 00:00:00+00',
  0.025, 0, 'PENDING', NOW(), NOW()
FROM seasons WHERE name = 'Season Alpha';

-- Rodada 3: 08/03 (Dom) 21h BR até 13/03 (Sex) 21h BR
INSERT INTO rounds (
  season_id, round_number, name, start_time, end_time,
  entry_fee, prize_pool, status, created_at, updated_at
)
SELECT id, 3, 'Rodada 3',
  '2026-03-09 00:00:00+00', '2026-03-14 00:00:00+00',
  0.025, 0, 'PENDING', NOW(), NOW()
FROM seasons WHERE name = 'Season Alpha';

-- Rodada 4: 15/03 (Dom) 21h BR até 20/03 (Sex) 21h BR
INSERT INTO rounds (
  season_id, round_number, name, start_time, end_time,
  entry_fee, prize_pool, status, created_at, updated_at
)
SELECT id, 4, 'Rodada 4',
  '2026-03-16 00:00:00+00', '2026-03-21 00:00:00+00',
  0.025, 0, 'PENDING', NOW(), NOW()
FROM seasons WHERE name = 'Season Alpha';

-- 3. Verificar
SELECT id, name, status,
       start_date AT TIME ZONE 'America/Sao_Paulo' as inicio_br,
       end_date AT TIME ZONE 'America/Sao_Paulo' as fim_br
FROM seasons WHERE name = 'Season Alpha';

SELECT r.id, r.round_number, r.name, r.status, r.entry_fee,
  r.start_time AT TIME ZONE 'America/Sao_Paulo' as inicio_br,
  r.end_time AT TIME ZONE 'America/Sao_Paulo' as fim_br
FROM rounds r
JOIN seasons s ON r.season_id = s.id
WHERE s.name = 'Season Alpha'
ORDER BY r.round_number;
