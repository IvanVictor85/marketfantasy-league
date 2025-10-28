/**
 * Gemini AI Service
 *
 * Serviço para integração com a API Gemini do Google para análises de mercado DeFi
 * e sugestões de melhorias em times de tokens.
 */

export interface DeFiProtocolAnalysis {
  protocol: string;
  tvl: number;
  change24h: number;
  category: string;
}

export interface TeamToken {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
}

export interface AIAnalysisResponse {
  analysis: string;
  suggestions?: string[];
}

/**
 * Serviço para análises com Gemini AI
 */
export class GeminiAIService {
  /**
   * Explica por que um protocolo DeFi teve mudanças significativas
   */
  static async explainProtocolChange(protocol: DeFiProtocolAnalysis): Promise<string> {
    const prompt = `
Você é um especialista em DeFi (Finanças Descentralizadas) e análise de mercado cripto.

Protocolo: ${protocol.protocol}
Categoria: ${protocol.category}
TVL Atual: $${(protocol.tvl / 1e9).toFixed(2)}B
Mudança 24h: ${protocol.change24h >= 0 ? '+' : ''}${protocol.change24h.toFixed(2)}%

${protocol.change24h > 0
  ? `Por que este protocolo está tendo um crescimento significativo de TVL?`
  : `Por que este protocolo está perdendo TVL?`
}

Explique em 2-3 frases de forma clara e educativa para iniciantes em cripto.
Considere fatores como:
- Mudanças no mercado geral
- Movimentos de capital entre protocolos
- Eventos específicos do protocolo (se relevante para a categoria ${protocol.category})
- Tendências de yield farming
- Sentimento do mercado

Responda diretamente sem introduções como "A queda pode estar relacionada".
`;

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'defi_protocol' })
      });

      if (!response.ok) {
        throw new Error('Falha ao analisar protocolo');
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Erro na análise do protocolo:', error);
      return 'Não foi possível gerar análise no momento. Tente novamente mais tarde.';
    }
  }

  /**
   * Analisa um time de tokens e sugere melhorias
   */
  static async analyzeTeam(tokens: TeamToken[]): Promise<AIAnalysisResponse> {
    const tokenSummary = tokens.map(t =>
      `- ${t.symbol} (${t.name}): $${t.currentPrice.toFixed(2)} | ${t.change24h >= 0 ? '+' : ''}${t.change24h.toFixed(2)}% (24h)`
    ).join('\n');

    const totalChange = tokens.reduce((sum, t) => sum + t.change24h, 0) / tokens.length;

    const prompt = `
Você é um especialista em análise de portfólio de criptomoedas e gestor de investimentos DeFi.

Analise este time/portfólio de 10 tokens:

${tokenSummary}

Performance média 24h: ${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%

Tarefa:
1. Faça uma análise HONESTA do portfólio (pontos fortes e fracos)
2. Identifique tokens problemáticos (baixa performance consistente ou alto risco)
3. Sugira 3-5 tokens alternativos para SUBSTITUIR os mais fracos
4. Justifique suas sugestões considerando:
   - Diversificação de categorias (DeFi, L1/L2, Memes, Gaming, etc.)
   - Balance entre risco e estabilidade
   - Potencial de crescimento
   - Tendências atuais do mercado

Formato da resposta:
**Análise Geral:**
[Sua análise em 2-3 frases]

**Pontos de Atenção:**
[Lista de 2-3 tokens problemáticos e por quê]

**Sugestões de Melhorias:**
1. Substituir [TOKEN] por [NOVO_TOKEN]: [justificativa breve]
2. Substituir [TOKEN] por [NOVO_TOKEN]: [justificativa breve]
3. [etc...]

Seja direto, prático e educativo. Use linguagem acessível para iniciantes.
`;

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'team_analysis' })
      });

      if (!response.ok) {
        throw new Error('Falha ao analisar time');
      }

      const data = await response.json();

      // Extrair sugestões do texto (formato: "Substituir X por Y")
      const suggestions = this.extractSuggestions(data.analysis);

      return {
        analysis: data.analysis,
        suggestions
      };
    } catch (error) {
      console.error('Erro na análise do time:', error);
      return {
        analysis: 'Não foi possível gerar análise no momento. Tente novamente mais tarde.',
        suggestions: []
      };
    }
  }

  /**
   * Extrai sugestões de tokens do texto de análise
   */
  private static extractSuggestions(text: string): string[] {
    const suggestions: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Buscar padrões como "Substituir X por Y" ou "X -> Y"
      const match = line.match(/Substituir\s+(\w+)\s+por\s+(\w+)/i) ||
                    line.match(/(\w+)\s*->\s*(\w+)/);

      if (match) {
        suggestions.push(`${match[1]} → ${match[2]}`);
      }
    }

    return suggestions.slice(0, 5); // Máximo 5 sugestões
  }

  /**
   * Gera análise comparativa entre duas chains
   */
  static async compareChains(chain1: string, chain2: string, tvl1: number, tvl2: number): Promise<string> {
    const prompt = `
Compare rapidamente essas duas blockchains em termos de ecossistema DeFi:

**${chain1}**: $${(tvl1 / 1e9).toFixed(2)}B TVL
**${chain2}**: $${(tvl2 / 1e9).toFixed(2)}B TVL

Em 2-3 frases, explique:
1. Qual está dominando e por quê?
2. Qual tem melhor perspectiva de crescimento?

Responda de forma direta e educativa.
`;

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'chain_comparison' })
      });

      if (!response.ok) {
        throw new Error('Falha ao comparar chains');
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Erro na comparação de chains:', error);
      return 'Não foi possível gerar comparação no momento.';
    }
  }
}
