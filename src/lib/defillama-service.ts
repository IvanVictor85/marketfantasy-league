/**
 * DefiLlama API Service
 *
 * Integração com a API do DefiLlama para obter dados de TVL (Total Value Locked),
 * protocolos DeFi e ecossistemas blockchain.
 *
 * API Docs: https://api-docs.defillama.com/
 */

const DEFILLAMA_API = 'https://api.llama.fi';

export interface DeFiProtocol {
  name: string;
  slug: string;
  tvl: number;
  change_1d: number;
  change_7d: number;
  category: string;
  chains: string[];
  logo: string;
  mcap?: number;
}

export interface Chain {
  name: string;
  tvl: number;
  tokenSymbol: string;
  chainId?: number;
}

export interface TVLHistoryPoint {
  date: number;
  totalLiquidityUSD: number;
}

export interface CategoryStats {
  category: string;
  tvl: number;
  protocolCount: number;
  percentage: number;
}

/**
 * Serviço para interagir com a API do DefiLlama
 */
export class DefiLlamaService {
  /**
   * Busca todos os protocolos DeFi
   */
  static async getAllProtocols(): Promise<DeFiProtocol[]> {
    try {
      const response = await fetch(`${DEFILLAMA_API}/protocols`, {
        next: { revalidate: 300 } // Cache por 5 minutos
      });

      if (!response.ok) {
        throw new Error(`DefiLlama API error: ${response.status}`);
      }

      const data = await response.json();

      return data.map((p: any) => ({
        name: p.name,
        slug: p.slug,
        tvl: p.tvl || 0,
        change_1d: p.change_1d || 0,
        change_7d: p.change_7d || 0,
        category: p.category || 'Other',
        chains: p.chains || [],
        logo: p.logo || '',
        mcap: p.mcap
      }));
    } catch (error) {
      console.error('Erro ao buscar protocolos DefiLlama:', error);
      return [];
    }
  }

  /**
   * Busca protocolos em alta (maiores ganhos de TVL em 24h)
   */
  static async getTrendingProtocols(limit = 10): Promise<DeFiProtocol[]> {
    const protocols = await this.getAllProtocols();

    return protocols
      .filter(p => p.change_1d > 0 && p.tvl > 1000000) // Filtrar apenas com crescimento e TVL > $1M
      .sort((a, b) => b.change_1d - a.change_1d)
      .slice(0, limit);
  }

  /**
   * Busca protocolos em queda (maiores perdas de TVL em 24h)
   */
  static async getDecliningProtocols(limit = 10): Promise<DeFiProtocol[]> {
    const protocols = await this.getAllProtocols();

    return protocols
      .filter(p => p.change_1d < 0 && p.tvl > 1000000) // Filtrar apenas com queda e TVL > $1M
      .sort((a, b) => a.change_1d - b.change_1d)
      .slice(0, limit);
  }

  /**
   * Busca os maiores protocolos por TVL
   */
  static async getTopProtocolsByTVL(limit = 10): Promise<DeFiProtocol[]> {
    const protocols = await this.getAllProtocols();

    return protocols
      .filter(p => p.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);
  }

  /**
   * Busca todas as chains/ecossistemas
   */
  static async getAllChains(): Promise<Chain[]> {
    try {
      const response = await fetch(`${DEFILLAMA_API}/chains`, {
        next: { revalidate: 300 } // Cache por 5 minutos
      });

      if (!response.ok) {
        throw new Error(`DefiLlama API error: ${response.status}`);
      }

      const data = await response.json();

      return data.map((c: any) => ({
        name: c.name,
        tvl: c.tvl || 0,
        tokenSymbol: c.tokenSymbol || '',
        chainId: c.chainId
      }));
    } catch (error) {
      console.error('Erro ao buscar chains DefiLlama:', error);
      return [];
    }
  }

  /**
   * Busca as principais chains por TVL
   */
  static async getTopChains(limit = 10): Promise<Chain[]> {
    const chains = await this.getAllChains();

    return chains
      .filter(c => c.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);
  }

  /**
   * Busca histórico de TVL global
   */
  static async getGlobalTVLHistory(): Promise<TVLHistoryPoint[]> {
    try {
      const response = await fetch(`${DEFILLAMA_API}/charts`, {
        next: { revalidate: 3600 } // Cache por 1 hora
      });

      if (!response.ok) {
        throw new Error(`DefiLlama API error: ${response.status}`);
      }

      const data = await response.json();

      return data.map((point: any) => ({
        date: point.date,
        totalLiquidityUSD: point.totalLiquidityUSD
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico TVL:', error);
      return [];
    }
  }

  /**
   * Calcula crescimento de TVL em um período
   */
  static async getTVLGrowth(daysAgo = 7): Promise<number> {
    const history = await this.getGlobalTVLHistory();

    if (history.length < 2) return 0;

    const now = Date.now() / 1000;
    const targetDate = now - (daysAgo * 86400);

    const currentTVL = history[history.length - 1].totalLiquidityUSD;
    const pastPoint = history.find(h => h.date >= targetDate);
    const pastTVL = pastPoint?.totalLiquidityUSD || history[0].totalLiquidityUSD;

    if (pastTVL === 0) return 0;

    return ((currentTVL - pastTVL) / pastTVL) * 100;
  }

  /**
   * Agrupa protocolos por categoria e calcula estatísticas
   */
  static async getCategoryStats(): Promise<CategoryStats[]> {
    const protocols = await this.getAllProtocols();

    // Agrupar por categoria
    const categoryMap = new Map<string, { tvl: number, count: number }>();
    let totalTVL = 0;

    protocols.forEach(p => {
      if (p.tvl > 0) {
        const existing = categoryMap.get(p.category) || { tvl: 0, count: 0 };
        categoryMap.set(p.category, {
          tvl: existing.tvl + p.tvl,
          count: existing.count + 1
        });
        totalTVL += p.tvl;
      }
    });

    // Converter para array e calcular percentagens
    const stats: CategoryStats[] = [];

    categoryMap.forEach((value, category) => {
      stats.push({
        category,
        tvl: value.tvl,
        protocolCount: value.count,
        percentage: totalTVL > 0 ? (value.tvl / totalTVL) * 100 : 0
      });
    });

    // Ordenar por TVL
    return stats.sort((a, b) => b.tvl - a.tvl);
  }

  /**
   * Busca protocolos de uma categoria específica
   */
  static async getProtocolsByCategory(category: string, limit = 10): Promise<DeFiProtocol[]> {
    const protocols = await this.getAllProtocols();

    return protocols
      .filter(p => p.category.toLowerCase() === category.toLowerCase() && p.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);
  }

  /**
   * Formata valor em USD para exibição
   */
  static formatUSD(value: number): string {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  }

  /**
   * Formata percentagem para exibição
   */
  static formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }
}
