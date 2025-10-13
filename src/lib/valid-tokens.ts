// Lista de tokens válidos (gerada automaticamente da API)
// Última atualização: 2025-10-13T04:00:22.614Z
export const VALID_TOKEN_SYMBOLS = [
  'AAVE',
  'ADA',
  'ALGO',
  'APT',
  'ARB',
  'ASTER',
  'ATOM',
  'AVAX',
  'BCH',
  'BFUSD',
  'BGB',
  'BNB',
  'BNSOL',
  'BSC-USD',
  'BTC',
  'BUIDL',
  'C1USD',
  'CBBTC',
  'COAI',
  'CRO',
  'DAI',
  'DOGE',
  'DOT',
  'ENA',
  'ETC',
  'ETH',
  'EZETH',
  'FIGR_HELOC',
  'FLR',
  'GT',
  'HASH',
  'HBAR',
  'HTX',
  'HYPE',
  'ICP',
  'IP',
  'JITOSOL',
  'JLP',
  'KAS',
  'KCS',
  'KHYPE',
  'LBTC',
  'LEO',
  'LINK',
  'LSETH',
  'LTC',
  'M',
  'MNT',
  'NEAR',
  'OKB',
  'ONDO',
  'OSETH',
  'PAXG',
  'PENGU',
  'PEPE',
  'PI',
  'POL',
  'PUMP',
  'PYUSD',
  'QNT',
  'RENDER',
  'RETH',
  'RSETH',
  'SEI',
  'SHIB',
  'SKY',
  'SOL',
  'STETH',
  'SUI',
  'SUSDE',
  'SUSDS',
  'TAO',
  'TON',
  'TRUMP',
  'TRX',
  'UNI',
  'USD1',
  'USDC',
  'USDE',
  'USDF',
  'USDS',
  'USDT',
  'USDT0',
  'USDTB',
  'VET',
  'WBETH',
  'WBNB',
  'WBT',
  'WBTC',
  'WEETH',
  'WETH',
  'WETH',
  'WLD',
  'WLFI',
  'WSTETH',
  'XAUT',
  'XLM',
  'XMR',
  'XRP',
  'ZEC'
];

// Função para validar se um token é válido
export function isValidToken(symbol: string): boolean {
  return VALID_TOKEN_SYMBOLS.includes(symbol.toUpperCase());
}

// Função para validar uma lista de tokens
export function validateTokens(tokens: string[]): { valid: boolean; invalidTokens: string[] } {
  const invalidTokens = tokens.filter(token => !isValidToken(token));
  return {
    valid: invalidTokens.length === 0,
    invalidTokens
  };
}

// Função para obter todos os tokens válidos
export function getAllValidTokens(): string[] {
  return [...VALID_TOKEN_SYMBOLS];
}

// Função para verificar se a lista precisa ser atualizada
export function shouldUpdateTokenList(): boolean {
  // Implementar lógica para verificar se a lista está desatualizada
  // Por exemplo, verificar timestamp da última atualização
  return false;
}
