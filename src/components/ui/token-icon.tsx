import React from 'react';

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

// Cores específicas para tokens conhecidos
const tokenColors: Record<string, string> = {
  'BTC': '#F7931A',
  'ETH': '#627EEA',
  'BNB': '#F3BA2F',
  'XRP': '#23292F',
  'ADA': '#0033AD',
  'SOL': '#9945FF',
  'USDC': '#2775CA',
  'DOGE': '#C2A633',
  'TRX': '#FF060A',
  'AVAX': '#E84142',
  'LINK': '#375BD2',
  'MATIC': '#8247E5',
  'LTC': '#BFBBBB',
  'DOT': '#E6007A',
  'UNI': '#FF007A',
  'ICP': '#29ABE2',
  'ETC': '#328332',
  'XLM': '#000000',
  'FIL': '#0090FF',
  'ATOM': '#2E3148',
  'XMR': '#FF6600',
  'HBAR': '#000000',
  'CRO': '#003D7A',
  'NEAR': '#000000',
  'VET': '#15BDFF',
  'ALGO': '#000000',
  'FLOW': '#00EF8B',
  'APE': '#0052FF',
  'SAND': '#00D4FF'
};

// Função para gerar cor baseada no hash do símbolo
const generateColorFromSymbol = (symbol: string): string => {
  if (tokenColors[symbol]) {
    return tokenColors[symbol];
  }
  
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

export const TokenIcon: React.FC<TokenIconProps> = ({ 
  symbol, 
  size = 32, 
  className = '' 
}) => {
  const color = generateColorFromSymbol(symbol);
  const initials = symbol.slice(0, 2).toUpperCase();
  
  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full text-white font-bold ${className}`}
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: color,
        fontSize: size * 0.35
      }}
    >
      {initials}
    </div>
  );
};

export default TokenIcon;