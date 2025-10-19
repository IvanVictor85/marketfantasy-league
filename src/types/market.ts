// Bridge de tipos para páginas que importam '@/types/market'
// Reexporta os tipos usados pela análise de mercado
import type { MarketToken as MT, MarketAnalysisData } from '@/lib/market-analysis';

export type MarketToken = MT;
export type { MarketAnalysisData };

// Alias para compatibilidade
export type Token = MarketToken;