/**
 * Verifica se a rodada está aberta (entre 03:00 e 15:00 BRT).
 *
 * HORÁRIO DA RODADA:
 * - Abre: 03:00 AM (Horário de Brasília - America/Sao_Paulo)
 * - Fecha: 15:00 PM / 3:00 PM (Horário de Brasília - America/Sao_Paulo)
 *
 * LÓGICA:
 * - Hora atual >= 3 AND Hora atual < 15 → Rodada ABERTA
 * - Caso contrário → Rodada FECHADA
 *
 * IMPORTANTE:
 * - Usa Intl.DateTimeFormat para obter hora no fuso correto
 * - Seguro para rodar tanto no cliente quanto no servidor
 * - A verificação é feita em tempo real (não usa cache)
 *
 * @returns {boolean} - True se a rodada estiver aberta, false caso contrário.
 */
export function isRodadaAberta(): boolean {
  const fusoHorario = 'America/Sao_Paulo';

  // Obtém a hora atual especificamente no fuso horário de São Paulo
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    hour12: false,
    hour: 'numeric',
  });

  const horaAtualStr = formatter.format(new Date());
  const horaAtual = parseInt(horaAtualStr);

  // Define os horários de início e fim da janela
  const HORA_INICIO = 3;  // 03:00 AM
  const HORA_FIM = 15;    // 15:00 PM (3 PM)

  // A lógica é: a hora atual deve ser MAIOR OU IGUAL a 3
  // E MENOR que 15 (pois às 15:00 em ponto, a rodada fecha).
  const isAberta = horaAtual >= HORA_INICIO && horaAtual < HORA_FIM;

  return isAberta;
}

/**
 * Retorna informações detalhadas sobre o estado da rodada.
 * Útil para debugging e mensagens ao usuário.
 */
export function getRodadaInfo(): {
  isAberta: boolean;
  horaAtual: number;
  horaAbertura: number;
  horaFechamento: number;
  message: string;
} {
  const fusoHorario = 'America/Sao_Paulo';

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    hour12: false,
    hour: 'numeric',
  });

  const horaAtualStr = formatter.format(new Date());
  const horaAtual = parseInt(horaAtualStr);

  const HORA_INICIO = 3;
  const HORA_FIM = 15;

  const isAberta = horaAtual >= HORA_INICIO && horaAtual < HORA_FIM;

  let message = '';
  if (isAberta) {
    message = `Rodada aberta até às ${HORA_FIM}:00 (Horário de Brasília)`;
  } else if (horaAtual < HORA_INICIO) {
    message = `Rodada abre às ${HORA_INICIO}:00 (Horário de Brasília)`;
  } else {
    message = `Rodada encerrada. Próxima rodada abre às ${HORA_INICIO}:00 (Horário de Brasília)`;
  }

  return {
    isAberta,
    horaAtual,
    horaAbertura: HORA_INICIO,
    horaFechamento: HORA_FIM,
    message,
  };
}
