import * as cheerio from 'cheerio';

export interface XStockToken {
  xSymbol: string;
  symbol: string;
  name: string;
  mint: string;
}

const XSTOCKS_URL = 'https://xstocks.fi/products';

export function scrapeXStocksProducts(): Promise<XStockToken[]> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Fazendo scraping da página xStocks...');
      
      const response = await fetch(XSTOCKS_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      const tokens: XStockToken[] = [];
      
      // Procurar por elementos que contêm informações de tokens
      $('[data-mint], .token-item, .product-item').each((_, element) => {
        const $el = $(element);
        
        // Tentar extrair mint address
        let mint = $el.attr('data-mint') || $el.find('[data-mint]').attr('data-mint');
        
        if (!mint) {
          // Procurar por links do Solscan que contêm o mint
          const solscanLink = $el.find('a[href*="solscan.io"]').attr('href');
          if (solscanLink) {
            const mintMatch = solscanLink.match(/\/token\/([A-Za-z0-9]{32,44})/);
            if (mintMatch) {
              mint = mintMatch[1];
            }
          }
        }
        
        if (mint && mint.length >= 32) {
          // Extrair símbolo e nome
          const symbol = $el.find('.symbol, .token-symbol').text().trim() || 
                        $el.attr('data-symbol') || 
                        mint.substring(0, 6);
          
          const name = $el.find('.name, .token-name').text().trim() || 
                      $el.attr('data-name') || 
                      symbol;
          
          const xSymbol = `x${symbol}`;
          
          tokens.push({
            xSymbol,
            symbol,
            name,
            mint
          });
        }
      });
      
      // Se não encontrou tokens com os seletores específicos, tentar uma abordagem mais ampla
      if (tokens.length === 0) {
        $('a[href*="solscan.io"]').each((_, element) => {
          const href = $(element).attr('href');
          if (href) {
            const mintMatch = href.match(/\/token\/([A-Za-z0-9]{32,44})/);
            if (mintMatch) {
              const mint = mintMatch[1];
              const text = $(element).text().trim();
              const symbol = text || mint.substring(0, 6);
              const name = text || symbol;
              const xSymbol = `x${symbol}`;
              
              // Verificar se já existe
              const exists = tokens.some(t => t.mint === mint);
              if (!exists) {
                tokens.push({
                  xSymbol,
                  symbol,
                  name,
                  mint
                });
              }
            }
          }
        });
      }
      
      console.log(`Scraping concluído: ${tokens.length} tokens encontrados`);
      resolve(tokens);
      
    } catch (error) {
      console.error('Erro no scraping:', error);
      reject(new Error(`Falha no scraping: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
    }
  });
}