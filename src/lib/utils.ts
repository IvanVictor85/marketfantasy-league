import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata preços de tokens com precisão adequada
 * - Aceita null/undefined e retorna $0.00
 * - Preços >= $1: 2 casas decimais com formatação de moeda
 * - Preços >= $0.01: 4 casas decimais
 * - Preços < $0.01: 6 casas decimais
 */
export function formatTokenPrice(price: number | null | undefined): string {
  // Verificar se o valor é null, undefined ou 0
  if (!price || price === 0) {
    return '$0.00';
  }

  if (price >= 1) {
    // Preços maiores que $1: 2 casas decimais com formatação de moeda
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  } else if (price >= 0.01) {
    // Preços entre $0.01 e $1: 4 casas decimais
    return `$${price.toFixed(4)}`;
  } else {
    // Preços menores que $0.01: 6 casas decimais
    return `$${price.toFixed(6)}`;
  }
}

/**
 * Formata percentuais com sinal + ou -
 * Exemplo: +5.23% ou -3.45%
 */
export function formatPercentage(value: number): string {
  const formatted = value.toFixed(2);
  return `${value >= 0 ? '+' : ''}${formatted}%`;
}
