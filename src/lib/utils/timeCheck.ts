/**
 * Verifica se a rodada está EM ANDAMENTO (entre 21:00 e 15:00 BRT).
 *
 * LÓGICA CORRETA:
 * - Rodada EM ANDAMENTO (BLOQUEADA): 21:00 (9 PM) até 14:59 do dia seguinte (antes de 15:00)
 * - Rodada ABERTA (EDIÇÃO PERMITIDA): Qualquer horário fora da janela acima (15:00-20:59)
 *
 * IMPORTANTE:
 * - Usa Intl.DateTimeFormat para obter hora no fuso correto
 * - Seguro para rodar tanto no cliente quanto no servidor
 * - A verificação é feita em tempo real (não usa cache)
 *
 * @returns {boolean} - True se a rodada estiver EM ANDAMENTO (bloqueada), false caso contrário.
 */
export function isRodadaEmAndamento(): boolean {
  const fusoHorario = 'America/Sao_Paulo';

  // Obtém a hora atual especificamente no fuso horário de São Paulo
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    hour12: false,
    hour: 'numeric',
  });

  const horaAtualStr = formatter.format(new Date());
  const horaAtual = parseInt(horaAtualStr);

  // Define os horários de início e fim da janela de BLOQUEIO
  const HORA_INICIO_LOCK = 21;  // 21:00 (9 PM)
  const HORA_FIM_LOCK = 15;     // 15:00 (3 PM)

  // Retorna TRUE se a rodada estiver "em andamento" (bloqueada/travada)
  // Como a rodada atravessa a meia-noite (21:00 até 15:00 do dia seguinte),
  // precisamos verificar: hora >= 21 OU hora < 15
  return horaAtual >= HORA_INICIO_LOCK || horaAtual < HORA_FIM_LOCK;
}

/**
 * Retorna informações detalhadas sobre o estado da rodada.
 * Útil para debugging e mensagens ao usuário.
 */
export function getRodadaInfo(): {
  isEmAndamento: boolean;
  isEditavel: boolean;
  horaAtual: number;
  horaInicioLock: number;
  horaFimLock: number;
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

  const HORA_INICIO_LOCK = 21;
  const HORA_FIM_LOCK = 15;

  const isEmAndamento = horaAtual >= HORA_INICIO_LOCK || horaAtual < HORA_FIM_LOCK;
  const isEditavel = !isEmAndamento;

  let message = '';
  if (isEmAndamento) {
    message = `Rodada em Andamento (bloqueada até às ${HORA_FIM_LOCK}:00 - Horário de Brasília)`;
  } else if (horaAtual >= HORA_FIM_LOCK && horaAtual < HORA_INICIO_LOCK) {
    message = `Rodada Aberta (edição permitida). Bloqueio inicia às ${HORA_INICIO_LOCK}:00 (Horário de Brasília)`;
  } else {
    message = `Rodada Aberta (edição permitida). Próximo bloqueio às ${HORA_INICIO_LOCK}:00 (Horário de Brasília)`;
  }

  return {
    isEmAndamento,
    isEditavel,
    horaAtual,
    horaInicioLock: HORA_INICIO_LOCK,
    horaFimLock: HORA_FIM_LOCK,
    message,
  };
}
