'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Filter,
  Star,
  BarChart3,
  Globe,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useTokens, type Token } from '@/hooks/use-tokens';
import { type TokenMarketData } from '@/data/expanded-tokens';
import { useXstocksTokens, type UseXstocksTokensReturn } from '@/hooks/useXstocksTokens';
import { formatTokenPrice, formatPercentage } from '@/lib/utils';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

// Time periods for filtering
const timePeriods = [
  { label: '1h', value: 'oneHour' },
  { label: '24h', value: 'twentyFourHour' },
  { label: '7d', value: 'sevenDay' },
  { label: '30d', value: 'thirtyDay' }
];

// Função para aplicar filtro fixo baseado no tipo de liga
function applyFixedFilter(token: Token, filterType: 'xstocks' | 'defi' | 'meme' | 'gaming'): boolean {
  const tokenSymbol = token.symbol.toLowerCase();
  const tokenName = token.name.toLowerCase();
  
  switch (filterType) {
    case 'xstocks':
      // Filtrar apenas tokens xStocks reais baseados nos dados de xstocks.fi e coingecko
      const xStockSymbols = [
        'tslax', 'spyx', 'mstrx', 'nvdax', 'crclx', 'googlx', 'aaplx', 'qqqx', 'coinx', 'metax',
        // Fallback para símbolos antigos
        'xtsla', 'xaapl', 'xgoogl', 'xmsft', 'xamzn'
      ];
      const stockRelatedTokens = ['tsla', 'aapl', 'googl', 'msft', 'amzn', 'nvda', 'meta', 'coin']; // Tokens relacionados a ações (fallback)
      
      const isXStock = xStockSymbols.includes(tokenSymbol) ||
             stockRelatedTokens.includes(tokenSymbol) ||
             tokenName.toLowerCase().includes('xstock') ||
             (tokenName.toLowerCase().includes('stock') && !tokenName.toLowerCase().includes('gamestock'));
      
      return isXStock;
    
    case 'defi':
      // Filtrar tokens DeFi conhecidos
      const defiTokens = ['uni', 'aave', 'comp', 'mkr', 'snx', 'crv', 'sushi', 'yfi', '1inch', 'link'];
      return defiTokens.some(defi => tokenSymbol.includes(defi) || tokenName.includes(defi));
    
    case 'meme':
      // Filtrar meme coins
      const memeTokens = ['doge', 'shib', 'pepe', 'floki', 'bonk', 'wif', 'popcat'];
      return memeTokens.some(meme => tokenSymbol.includes(meme) || tokenName.includes(meme));
    
    case 'gaming':
      // Filtrar tokens de gaming
      const gamingTokens = ['axs', 'sand', 'mana', 'ape', 'gmt', 'stepn', 'ilv'];
      return gamingTokens.some(gaming => tokenSymbol.includes(gaming) || tokenName.includes(gaming));
    
    default:
      return true;
  }
}

interface TokenMarketProps {
  onSelectToken?: (token: Token) => void;
  selectedPosition?: string;
  selectedToken?: Token | null;
  onTokenSelect?: (token: Token | null) => void;
  usedTokens?: string[]; // Array of token IDs already used in the team
  onAddToField?: (token: Token) => void;
  fixedFilter?: {
    type: 'xstocks' | 'defi' | 'meme' | 'gaming';
    label: string;
  };
  onAutoPosition?: (token: Token) => void;
}

export function TokenMarket({ onSelectToken, selectedPosition, selectedToken, onTokenSelect, usedTokens = [], fixedFilter, onAutoPosition }: TokenMarketProps) {
  const tCommon = useTranslations('common');
  const t = useTranslations('market');

  // Use different hooks based on filter type
  const isXStocks = fixedFilter?.type === 'xstocks';
  
  // Regular tokens hook
  const regularTokensData = useTokens();
  
  // XStocks tokens hook
  const xstocksTokensData = useXstocksTokens({
    autoFetch: isXStocks,
    debug: false
  });
  
  // Memoize the mapped xStocks tokens to prevent recreation on every render
  const mappedXStocksTokens = useMemo(() => {
    return xstocksTokensData.tokens.map((xstock, index) => ({
      id: xstock.mint,
      rank: index + 1,
      name: xstock.name,
      symbol: xstock.symbol,
      image: xstock.image || '/icons/default-token.svg',
      price: xstock.priceUsd || 0,
      change_5m: 0,
      change_15m: 0,
      change_30m: 0,
      change_1h: 0,
      change_4h: 0,
      change_12h: 0,
      change_24h: xstock.change24h || 0,
      change_1d: xstock.change24h || 0,
      change_1w: 0,
      change_7d: xstock.change7d || 0,
      change_30d: 0,
      market_cap: xstock.marketCapUsd || 0,
      volume_24h: xstock.volume24hUsd || 0,
      circulating_supply: 0,
      rarity: 'common' as const
    }));
  }, [xstocksTokensData.tokens]);
  
  // Select the appropriate data source
  const rawTokens = isXStocks ? mappedXStocksTokens : regularTokensData.tokens;
  const loading = isXStocks ? xstocksTokensData.loading : regularTokensData.loading;
  const error = isXStocks ? xstocksTokensData.error : regularTokensData.error;
  const refetch = isXStocks ? xstocksTokensData.refetch : regularTokensData.refetch;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change_24h' | 'change_7d' | 'market_cap' | string>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filteredTokens, setFilteredTokens] = useState<TokenMarketData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('twentyFourHour');

  // Removed isClient logic to fix hydration issues

  useEffect(() => {
    if (!rawTokens.length) return;
    
    let filtered = rawTokens.filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Aplicar filtro fixo se especificado (apenas para tokens não-xStocks)
      if (fixedFilter && !isXStocks) {
        const matchesFixedFilter = applyFixedFilter(token, fixedFilter.type);
        return matchesSearch && matchesFixedFilter;
      }
      
      return matchesSearch;
    });

    // Sort tokens
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'rank') {
        comparison = a.rank - b.rank;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        comparison = a.price - b.price;
      } else if (sortBy === 'market_cap') {
        comparison = a.market_cap - b.market_cap;
      } else if (sortBy.startsWith('change_')) {
        // Ordenação dinâmica baseada no período selecionado
        const aValue = a[sortBy as keyof typeof a] as number || 0;
        const bValue = b[sortBy as keyof typeof b] as number || 0;
        comparison = aValue - bValue;
      } else {
        comparison = a.market_cap - b.market_cap;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTokens(filtered);
  }, [rawTokens, searchTerm, sortBy, sortOrder, selectedPeriod, fixedFilter, isXStocks]);

  // Removidas as funções antigas - agora usando formatTokenPrice e formatPercentage do utils

  // Função formatPercentage agora vem do utils

  const getPercentageColorClass = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'text-gray-600';
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatMarketCap = (marketCap: number | undefined | null) => {
    if (marketCap === undefined || marketCap === null) return '$0';
    try {
      if (marketCap >= 1e12) {
        return `$${(marketCap / 1e12).toFixed(2)}T`;
      } else if (marketCap >= 1e9) {
        return `$${(marketCap / 1e9).toFixed(2)}B`;
      } else if (marketCap >= 1e6) {
        return `$${(marketCap / 1e6).toFixed(2)}M`;
      }
      return `$${marketCap.toLocaleString()}`;
    } catch (error) {
      return '$0';
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending for most columns, ascending for rank
      setSortBy(column as any);
      setSortOrder(column === 'rank' ? 'asc' : 'desc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleTokenClick = (token: Token) => {
    if (selectedToken?.id === token.id) {
      // Deselect if already selected
      onTokenSelect?.(null);
    } else if (selectedPosition) {
      // Se já tem uma posição selecionada, adiciona o token diretamente
      onSelectToken?.(token);
      onTokenSelect?.(null); // Limpa a seleção após adicionar
    } else {
      // Select new token
      onTokenSelect?.(token);
    }
  };

  const handleAddToField = (token: Token) => {
    onSelectToken?.(token);
    onTokenSelect?.(null); // Clear selection after adding
  };

  const handleDragStart = (e: React.DragEvent, token: Token) => {
    e.dataTransfer.setData('application/json', JSON.stringify(token));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-purple-100 text-purple-800';
      case 'epic': return 'bg-orange-100 text-orange-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'common': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Mercado de Tokens
            </CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Carregando...
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Carregando tokens da CoinGecko...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Mercado de Tokens
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar Novamente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Erro ao carregar tokens: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col p-0 m-0">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Token Market
            </CardTitle>
            {fixedFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Filter className="w-3 h-3" />
                {fixedFilter.label}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">{tCommon('update')}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">{tCommon('filters')}</span>
            </Button>
          </div>
        </div>
        
        <div className="mt-4 relative px-2 md:px-0">
          <Search className="absolute left-5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t('searchPlaceholder')}
            className="pl-11 md:pl-9 w-full mx-2 md:mx-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="mt-4 px-2 md:px-0">
          <select 
            className="text-sm border rounded p-2 w-full mx-2 md:mx-0 bg-background text-foreground dark:bg-gray-800 dark:border-gray-700"
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
              setSortBy(e.target.value);
            }}
          >
            {timePeriods.map((period) => (
              <option key={period.value} value={period.value}>
                {t('period')}: {period.label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow overflow-auto pb-0 mb-0">
        {/* Desktop Table Header */}
        <div className="hidden md:grid sticky top-0 grid-cols-12 gap-3 px-4 py-3 bg-muted border-b border-border text-sm font-semibold text-muted-foreground">
          <div 
            className="col-span-1 text-center cursor-pointer hover:text-primary transition-colors flex items-center justify-center gap-1"
            onClick={() => handleSort('rank')}
          >
            #
            {sortBy === 'rank' && (
              <span className="text-xs">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
          <div 
            className="col-span-3 cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
            onClick={() => handleSort('name')}
          >
            TOKEN
            {sortBy === 'name' && (
              <span className="text-xs">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
          <div
            className="col-span-2 text-right cursor-pointer hover:text-primary transition-colors flex items-center justify-end gap-1"
            onClick={() => handleSort('price')}
          >
            {t('priceHeader')}
            {sortBy === 'price' && (
              <span className="text-xs">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
          <div 
            className="col-span-2 text-right cursor-pointer hover:text-primary transition-colors flex items-center justify-end gap-1"
            onClick={() => handleSort('change_7d')}
          >
            7d %
            {sortBy === 'change_7d' && (
              <span className="text-xs">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
          <div className="col-span-2 text-right">
            <select 
              className="text-sm font-semibold border-none bg-transparent focus:ring-0 p-0 cursor-pointer hover:text-accent dark:text-gray-200 transition-colors"
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setSortBy(e.target.value);
              }}
            >
              {timePeriods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label} %
                </option>
              ))}
            </select>
          </div>
          <div 
            className="col-span-2 text-right cursor-pointer hover:text-primary transition-colors flex items-center justify-end gap-1"
            onClick={() => handleSort('market_cap')}
          >
            MCAP
            {sortBy === 'market_cap' && (
              <span className="text-xs">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </div>

        {/* Mobile Table Header */}
        <div className="md:hidden sticky top-0 px-4 py-3 bg-muted border-b border-border text-sm font-semibold text-muted-foreground">
          <div className="flex justify-between items-center gap-2">
            <span>TOKENS</span>
            <div className="flex gap-2">
              <select 
                className="text-xs font-semibold border-none bg-transparent focus:ring-0 p-0 cursor-pointer hover:text-accent dark:text-gray-200 transition-colors"
                value={sortBy}
                onChange={(e) => {
                  const newSortBy = e.target.value;
                  if (newSortBy.startsWith('change_')) {
                    setSelectedPeriod(newSortBy);
                  }
                  setSortBy(newSortBy);
                }}
              >
                <option value="rank">Rank</option>
                <option value="name">Nome</option>
                <option value="price">Preço</option>
                <option value="change_7d">7d %</option>
                <option value="market_cap">MCAP</option>
                {timePeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label} %
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-xs font-semibold cursor-pointer hover:text-primary transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Token List */}
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredTokens.map((token, index) => {
            const isSelected = selectedToken?.id === token.id;
            const isUsed = usedTokens.includes(token.symbol);
            
            return (
              <div key={token.id}>
                {/* Desktop Layout */}
                <div 
                  className={`hidden md:grid grid-cols-12 gap-3 px-4 py-3 border-b transition-colors ${
                    isUsed 
                      ? 'bg-red-50 border-red-200 opacity-60 cursor-not-allowed dark:bg-red-900/20 dark:border-red-800' 
                      : isSelected 
                        ? 'bg-primary/10 border-primary/30 cursor-pointer dark:bg-orange-900/20 dark:border-orange-700/50' 
                        : 'hover:bg-muted/50 cursor-pointer dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => !isUsed && handleTokenClick(token)}
                  onDoubleClick={() => !isUsed && onAutoPosition?.(token)}
                  draggable={!isUsed}
                  onDragStart={(e) => !isUsed && handleDragStart(e, token)}
                >
                <div className="col-span-1 text-sm text-gray-600 dark:text-gray-400 text-center">
                  {index + 1}
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    {token.image.startsWith('/') ? (
                      // Use Next.js Image component for local images (xStocks)
                      <Image 
                        src={token.image} 
                        alt={`${token.name} logo`} 
                        width={28} 
                        height={28} 
                        className="rounded-full shadow-sm flex-shrink-0"
                      />
                    ) : (
                      // Use Next.js Image component for external images
                      <Image 
                        src={token.image} 
                        alt={`${token.name} logo`} 
                        width={28} 
                        height={28} 
                        className="rounded-full shadow-sm flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium text-sm truncate ${isSelected ? 'text-gray-900 dark:text-gray-100' : 'dark:text-gray-100'}`} title={token.name}>
                        {token.name}
                      </div>
                      <div className={`text-xs font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${isSelected ? 'text-blue-900 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50' : 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30'}`}>
                        {token.symbol}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 text-sm font-medium text-right dark:text-gray-100">
                  {formatTokenPrice(token.price)}
                </div>
                
                <div className="col-span-2 text-sm font-medium text-right">
                  <span className={getPercentageColorClass(token.change_7d)}>
                    {formatPercentage(token.change_7d)}
                  </span>
                </div>
                
                <div className="col-span-2 text-sm font-medium text-right">
                  <span className={getPercentageColorClass(
                    selectedPeriod === 'oneHour' ? token.change_1h :
                    selectedPeriod === 'twentyFourHour' ? token.change_24h :
                    selectedPeriod === 'sevenDay' ? token.change_7d :
                    selectedPeriod === 'thirtyDay' ? token.change_30d : 0
                  )}>
                    {formatPercentage(
                      selectedPeriod === 'oneHour' ? token.change_1h :
                      selectedPeriod === 'twentyFourHour' ? token.change_24h :
                      selectedPeriod === 'sevenDay' ? token.change_7d :
                      selectedPeriod === 'thirtyDay' ? token.change_30d : 0
                    )}
                  </span>
                </div>
                
                <div className="col-span-2 text-sm font-medium text-right flex items-center justify-end gap-2">
                  <span className="dark:text-gray-100">{formatMarketCap(token.market_cap)}</span>
                  <Button
                    size="sm"
                    variant={isUsed ? "destructive" : isSelected ? "default" : "outline"}
                    className={`h-6 w-6 p-0 flex items-center justify-center ${
                      isUsed 
                        ? 'bg-red-100 text-red-600 cursor-not-allowed' 
                        : isSelected 
                          ? 'bg-primary text-white' 
                          : ''
                    }`}
                    disabled={isUsed}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isUsed) {
                        if (isSelected && selectedPosition) {
                          handleAddToField(token);
                        } else {
                          handleTokenClick(token);
                        }
                      }
                    }}
                  >
                    {isUsed ? '✗' : isSelected && selectedPosition ? '✓' : '+'}
                  </Button>
                </div>
                </div>

                {/* Mobile Layout */}
                <div 
                  className={`md:hidden px-4 py-3 border-b transition-colors ${
                    isUsed 
                      ? 'bg-red-50 border-red-200 opacity-60 cursor-not-allowed dark:bg-red-900/20 dark:border-red-800' 
                      : isSelected 
                        ? 'bg-primary/10 border-primary/30 cursor-pointer dark:bg-orange-900/20 dark:border-orange-700/50' 
                        : 'hover:bg-muted/50 cursor-pointer dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => !isUsed && handleTokenClick(token)}
                  onDoubleClick={() => !isUsed && onAutoPosition?.(token)}
                  draggable={!isUsed}
                  onDragStart={(e) => !isUsed && handleDragStart(e, token)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium w-6 text-center flex-shrink-0">
                        {index + 1}
                      </span>
                      {token.image.startsWith('/') ? (
                        <Image 
                          src={token.image} 
                          alt={`${token.name} logo`} 
                          width={32} 
                          height={32} 
                          className="rounded-full shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <Image 
                          src={token.image} 
                          alt={`${token.name} logo`} 
                          width={32} 
                          height={32} 
                          className="rounded-full shadow-sm flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate dark:text-gray-100" title={token.name}>
                          {token.name}
                        </div>
                        <div className="text-xs font-bold text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 px-1.5 py-0.5 rounded inline-block">
                          {token.symbol}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant={isUsed ? "destructive" : isSelected ? "default" : "outline"}
                        className={`h-8 w-8 p-0 flex items-center justify-center ${
                          isUsed 
                            ? 'bg-red-100 text-red-600 cursor-not-allowed' 
                            : isSelected 
                              ? 'bg-primary text-white' 
                              : ''
                        }`}
                        disabled={isUsed}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isUsed) {
                            if (isSelected && selectedPosition) {
                              handleAddToField(token);
                            } else {
                              handleTokenClick(token);
                            }
                          }
                        }}
                      >
                        {isUsed ? '✗' : isSelected && selectedPosition ? '✓' : '+'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-gray-500 dark:text-gray-400 mb-1">Preço</div>
                      <div className="font-medium dark:text-gray-100">{formatTokenPrice(token.price)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 dark:text-gray-400 mb-1">
                        {timePeriods.find(p => p.value === selectedPeriod)?.label || 'N/A'} %
                      </div>
                      <div className={`font-medium ${getPercentageColorClass(
                        selectedPeriod === 'oneHour' ? token.change_1h :
                        selectedPeriod === 'twentyFourHour' ? token.change_24h :
                        selectedPeriod === 'sevenDay' ? token.change_7d :
                        selectedPeriod === 'thirtyDay' ? token.change_30d : 0
                      )}`}>
                        {formatPercentage(
                          selectedPeriod === 'oneHour' ? token.change_1h :
                          selectedPeriod === 'twentyFourHour' ? token.change_24h :
                          selectedPeriod === 'sevenDay' ? token.change_7d :
                          selectedPeriod === 'thirtyDay' ? token.change_30d : 0
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 dark:text-gray-400 mb-1">MCAP</div>
                      <div className="font-medium dark:text-gray-100">{formatMarketCap(token.market_cap)}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}