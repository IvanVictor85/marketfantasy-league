/**
 * Verifica se a rodada/competição está EM ANDAMENTO (bloqueada para edição).
 *
 * LÓGICA DE NEGÓCIO (Horário de Brasília - UTC-3):
 *
 * 📅 PERÍODO DE DRAFT (Edição PERMITIDA):
 *    - Sexta-feira das 21h em diante
 *    - Sábado (dia todo)
 *    - Domingo até às 21h
 *    → Retorna FALSE (não está em andamento = pode editar)
 *
 * 🏆 PERÍODO DE COMPETIÇÃO (Edição BLOQUEADA):
 *    - Domingo das 21h em diante
 *    - Segunda, Terça, Quarta, Quinta (dias inteiros)
 *    - Sexta até às 20h59
 *    → Retorna TRUE (está em andamento = bloqueado)
 *
 * IMPORTANTE:
 * - Usa Intl.DateTimeFormat para obter dia da semana e hora no fuso correto
 * - Seguro para rodar tanto no cliente quanto no servidor
 * - A verificação é feita em tempo real (não usa cache)
 *
 * @returns {boolean} - True se a rodada estiver EM ANDAMENTO (bloqueada), false se é Draft (editável).
 */
export function isRodadaEmAndamento(): boolean {
  const fusoHorario = 'America/Sao_Paulo';
  const now = new Date();

  // Obtém o dia da semana e a hora no fuso horário de São Paulo
  const formatterDia = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    weekday: 'long', // 'domingo', 'segunda-feira', etc.
  });

  const formatterHora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    hour12: false,
    hour: 'numeric',
  });

  const diaDaSemanaNome = formatterDia.format(now).toLowerCase();
  const horaAtualStr = formatterHora.format(now);
  const horaAtual = parseInt(horaAtualStr);

  // Mapear nome do dia para número (Domingo = 0, Segunda = 1, ..., Sábado = 6)
  const diasMap = {
    'domingo': 0,
    'segunda-feira': 1,
    'terça-feira': 2,
    'quarta-feira': 3,
    'quinta-feira': 4,
    'sexta-feira': 5,
    'sábado': 6,
  };

  const diaDaSemana = diasMap[diaDaSemanaNome] ?? 0;

  // --- PERÍODO DE DRAFT (Edição PERMITIDA - retorna FALSE) ---

  // Sexta-feira (5) depois das 21h
  if (diaDaSemana === 5 && horaAtual >= 21) {
    return false; // É Draft - edição PERMITIDA
  }

  // Sábado (6) o dia todo
  if (diaDaSemana === 6) {
    return false; // É Draft - edição PERMITIDA
  }

  // Domingo (0) antes das 21h
  if (diaDaSemana === 0 && horaAtual < 21) {
    return false; // É Draft - edição PERMITIDA
  }

  // --- PERÍODO DE COMPETIÇÃO (Edição BLOQUEADA - retorna TRUE) ---
  // Se não caiu em nenhuma das regras acima, a rodada está em andamento.
  // Ex: Domingo 21h+, Segunda, Terça, Quarta, Quinta, Sexta antes das 21h
  return true; // Rodada em andamento - edição BLOQUEADA
}

/**
 * Retorna informações detalhadas sobre o estado da rodada.
 * Útil para debugging e mensagens ao usuário.
 */
export function getRodadaInfo(): {
  isEmAndamento: boolean;
  isEditavel: boolean;
  diaDaSemana: number;
  horaAtual: number;
  message: string;
} {
  const fusoHorario = 'America/Sao_Paulo';
  const now = new Date();

  const formatterDia = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    weekday: 'long',
  });

  const formatterHora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    hour12: false,
    hour: 'numeric',
  });

  const diaDaSemanaNome = formatterDia.format(now).toLowerCase();
  const horaAtualStr = formatterHora.format(now);
  const horaAtual = parseInt(horaAtualStr);

  const diasMap = {
    'domingo': 0,
    'segunda-feira': 1,
    'terça-feira': 2,
    'quarta-feira': 3,
    'quinta-feira': 4,
    'sexta-feira': 5,
    'sábado': 6,
  };

  const diaDaSemana = diasMap[diaDaSemanaNome] ?? 0;

  const isEmAndamento = isRodadaEmAndamento();
  const isEditavel = !isEmAndamento;

  let message = '';
  if (isEditavel) {
    message = 'Período de Draft - Edição Permitida (Sexta 21h até Domingo 21h)';
  } else {
    message = 'Rodada em Andamento - Edição Bloqueada (Domingo 21h até Sexta 21h)';
  }

  return {
    isEmAndamento,
    isEditavel,
    diaDaSemana,
    horaAtual,
    message,
  };
}
