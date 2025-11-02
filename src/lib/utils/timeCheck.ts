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
  
  // getUTCDay() retorna 0 para Domingo, 1 para Segunda, ..., 6 para Sábado.
  const diaDaSemanaUTC = now.getUTCDay();

  // --- Período de DRAFT (Edição PERMITIDA) ---
  // O DRAFT acontece no Sábado (6) e no Domingo (0), no horário UTC.
  if (diaDaSemanaUTC === 6 || diaDaSemanaUTC === 0) {
    return false; // Edição PERMITIDA
  }

  // --- Período de Competição ATIVA (Edição BLOQUEADA) ---
  // Se for Segunda (1), Terça (2), Quarta (3), Quinta (4), ou Sexta (5) (UTC).
  return true; // Edição BLOQUEADA
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
