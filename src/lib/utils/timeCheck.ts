/**
 * Verifica se a rodada de competição está atualmente em andamento (edição bloqueada).
 *
 * As regras de negócio são baseadas no fuso horário de Brasília (BRT, UTC-3):
 * - DRAFT (Edição PERMITIDA): Sexta 21:00 BRT até Domingo 21:00 BRT.
 * - ATIVA (Edição BLOQUEADA): Domingo 21:00 BRT até Sexta 21:00 BRT.
 *
 * O servidor Vercel roda em UTC. Vamos converter as regras para UTC:
 * - DRAFT (PERMITIDA): Sábado 00:00 UTC até Segunda 00:00 UTC.
 * - ATIVA (BLOQUEADA): Segunda 00:00 UTC até Sábado 00:00 UTC.
 *
 * @param now A data/hora atual (o padrão é a hora do servidor, que é UTC).
 * @returns {boolean} Retorna `true` se a rodada estiver ATIVA (bloqueada), `false` se estiver em DRAFT (permitida).
 */
export function isRodadaEmAndamento(now = new Date()): boolean {
  // 🧪 MODO DE TESTE: Sempre permite edição (para desenvolvimento/testes)
  // TODO: Remover esta linha e descomentar a lógica abaixo para produção
  return false;

  // getUTCDay() retorna 0 para Domingo, 1 para Segunda, ..., 6 para Sábado.
  // const diaDaSemanaUTC = now.getUTCDay();

  // // --- Período de DRAFT (Edição PERMITIDA) ---
  // // O DRAFT acontece no Sábado (6) e no Domingo (0), no horário UTC.
  // if (diaDaSemanaUTC === 6 || diaDaSemanaUTC === 0) {
  //   return false; // Edição PERMITIDA
  // }

  // // --- Período de Competição ATIVA (Edição BLOQUEADA) ---
  // // Se for Segunda (1), Terça (2), Quarta (3), Quinta (4), ou Sexta (5) (UTC).
  // return true; // Edição BLOQUEADA
}

/**
 * Retorna informações detalhadas sobre o estado da rodada.
 * Útil para debugging e mensagens ao usuário.
 */
export function getRodadaInfo(now = new Date()): {
  isEmAndamento: boolean;
  isEditavel: boolean;
  diaDaSemana: number;
  message: string;
} {
  const diaDaSemanaUTC = now.getUTCDay();
  const isEmAndamento = isRodadaEmAndamento(now);
  const isEditavel = !isEmAndamento;

  const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const diaAtual = diasNomes[diaDaSemanaUTC];

  let message = '';
  if (isEditavel) {
    message = `Período de Draft - Edição Permitida (Sábado/Domingo UTC = Sexta 21h até Domingo 21h BRT). Hoje é ${diaAtual} UTC.`;
  } else {
    message = `Rodada em Andamento - Edição Bloqueada (Segunda a Sexta UTC = Domingo 21h até Sexta 21h BRT). Hoje é ${diaAtual} UTC.`;
  }

  return {
    isEmAndamento,
    isEditavel,
    diaDaSemana: diaDaSemanaUTC,
    message,
  };
}

/**
 * Calcula a data/hora do próximo "Domingo às 21:00 BRT" (que é Segunda 00:00 UTC).
 *
 * Regra de Negócio:
 * - A rodada ATIVA começa no Domingo às 21:00 BRT (Segunda 00:00 UTC)
 * - BRT = UTC-3
 * - Domingo 21:00 BRT = Segunda 00:00 UTC
 *
 * @param now A data/hora atual (padrão: agora)
 * @returns {Date} A próxima ocorrência de "Domingo 21:00 BRT" (Segunda 00:00 UTC)
 */
export function getNextRoundStart(now = new Date()): Date {
  // Trabalhamos em UTC para consistência com o servidor
  const currentUTC = new Date(now.getTime());

  // Pegamos o dia da semana atual em UTC (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
  const currentDayUTC = currentUTC.getUTCDay();

  // Queremos encontrar a próxima Segunda-feira às 00:00 UTC (= Domingo 21:00 BRT)
  const targetDayUTC = 1; // Segunda-feira

  // Calcular quantos dias até a próxima Segunda-feira
  let daysUntilTarget = (targetDayUTC - currentDayUTC + 7) % 7;

  // Se estamos NA Segunda-feira (dia 1) mas JÁ passou da meia-noite UTC,
  // queremos a PRÓXIMA Segunda (daqui 7 dias)
  if (daysUntilTarget === 0) {
    // Estamos na Segunda-feira. Verificar se já passou das 00:00 UTC
    const currentHourUTC = currentUTC.getUTCHours();
    const currentMinuteUTC = currentUTC.getUTCMinutes();
    const currentSecondUTC = currentUTC.getUTCSeconds();

    // Se já passou nem que seja 1 segundo das 00:00:00, queremos a próxima Segunda
    if (currentHourUTC > 0 || currentMinuteUTC > 0 || currentSecondUTC > 0) {
      daysUntilTarget = 7;
    }
  }

  // Criar uma nova data para a próxima Segunda às 00:00 UTC
  const nextRoundStart = new Date(Date.UTC(
    currentUTC.getUTCFullYear(),
    currentUTC.getUTCMonth(),
    currentUTC.getUTCDate() + daysUntilTarget,
    0, // hora: 00
    0, // minuto: 00
    0, // segundo: 00
    0  // milissegundo: 000
  ));

  return nextRoundStart;
}
