/**
 * Verifica se a rodada está EM ANDAMENTO (após 27/10/2025 21:00 BRT).
 *
 * LÓGICA ATUALIZADA:
 * - Rodada INICIA: 27/10/2025 às 21:00 (Horário de Brasília)
 * - Antes dessa data/hora: EDIÇÃO PERMITIDA (retorna false)
 * - Após essa data/hora: Segue lógica de horário (21:00-08:59 bloqueado, 09:00-20:59 aberto)
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
  const now = new Date();

  // 🎯 DATA/HORA DE INÍCIO DA PRIMEIRA RODADA: 27/10/2025 21:00 BRT
  const RODADA_INICIO = new Date('2025-10-27T21:00:00-03:00');

  // ✅ Se ainda não chegou a data/hora de início, edição está PERMITIDA
  if (now < RODADA_INICIO) {
    return false; // Edição permitida até 27/10 às 21:00
  }

  // ✅ Após a data de início, aplica a lógica de horário
  // Obtém a hora atual especificamente no fuso horário de São Paulo
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    hour12: false,
    hour: 'numeric',
  });

  const horaAtualStr = formatter.format(now);
  const horaAtual = parseInt(horaAtualStr);

  // Define os horários de início e fim da janela de BLOQUEIO
  const HORA_INICIO_LOCK = 21;  // 21:00 (9 PM)
  const HORA_FIM_LOCK = 9;      // 09:00 AM (Manhã seguinte)

  // Retorna TRUE se a rodada estiver "em andamento" (bloqueada/travada)
  // A lógica correta que atravessa a meia-noite:
  // Retorna TRUE (bloqueado) se:
  // - horaAtual for 21, 22, ou 23 (>= HORA_INICIO_LOCK)
  // OU
  // - horaAtual for 0, 1, 2... até 8 (< HORA_FIM_LOCK)
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
  const now = new Date();

  // 🎯 DATA/HORA DE INÍCIO DA PRIMEIRA RODADA: 27/10/2025 21:00 BRT
  const RODADA_INICIO = new Date('2025-10-27T21:00:00-03:00');

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    hour12: false,
    hour: 'numeric',
  });

  const horaAtualStr = formatter.format(now);
  const horaAtual = parseInt(horaAtualStr);

  const HORA_INICIO_LOCK = 21;
  const HORA_FIM_LOCK = 9;

  // ✅ Se ainda não chegou a data/hora de início
  if (now < RODADA_INICIO) {
    return {
      isEmAndamento: false,
      isEditavel: true,
      horaAtual,
      horaInicioLock: HORA_INICIO_LOCK,
      horaFimLock: HORA_FIM_LOCK,
      message: `Rodada Aberta (edição permitida até 27/10 às 21:00 - Horário de Brasília)`,
    };
  }

  const isEmAndamento = horaAtual >= HORA_INICIO_LOCK || horaAtual < HORA_FIM_LOCK;
  const isEditavel = !isEmAndamento;

  let message = '';
  if (isEmAndamento) {
    message = `Rodada em Andamento (bloqueada até às 09:00 - Horário de Brasília)`;
  } else if (horaAtual >= HORA_FIM_LOCK && horaAtual < HORA_INICIO_LOCK) {
    message = `Rodada Aberta (edição permitida). Bloqueio inicia às 21:00 (Horário de Brasília)`;
  } else {
    message = `Rodada Aberta (edição permitida). Próximo bloqueio às 21:00 (Horário de Brasília)`;
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
