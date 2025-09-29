'use client';

import React, { useState, useEffect } from 'react';
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
import Image from 'next/image';

// Time periods for filtering
const timePeriods = [
  { label: '1h', value: 'oneHour' },
  { label: '24h', value: 'twentyFourHour' },
  { label: '7d', value: 'sevenDay' },
  { label: '30d', value: 'thirtyDay' }
];

interface TokenMarketProps {
  onSelectToken?: (token: Token) => void;
  selectedPosition?: string;
  selectedToken?: Token | null;
  onTokenSelect?: (token: Token | null) => void;
  usedTokens?: string[]; // Array of token IDs already used in the team
  onAddToField?: (token: Token) => void;
}

export function TokenMarket({ onSelectToken, selectedPosition, selectedToken, onTokenSelect, usedTokens = [] }: TokenMarketProps) {
  const { tokens, loading, error, refetch } = useTokens();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change_24h' | 'change_7d' | 'market_cap' | string>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('twentyFourHour');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!tokens.length) return;
    
    let filtered = tokens.filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    // Sort tokens
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'rank') {
        comparison = a.rank - b.rank;
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
  }, [tokens, searchTerm, sortBy, sortOrder, selectedPeriod]);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(4)}`;
  };

  const formatCurrency = (price: number | undefined | null) => {
    if (price === undefined || price === null) return '$0.00';
    try {
      if (price >= 1000) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return `$${price.toFixed(4)}`;
    } catch (error) {
      return '$0.00';
    }
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '0.00%';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

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
      case 'common': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isClient || loading) {
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
              onClick={refetch}
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
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Token Market
          </CardTitle>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </div>
        </div>
        
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar token..."
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="mt-4">
          <select 
            className="text-sm border rounded p-1 w-full"
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
              setSortBy(e.target.value);
            }}
          >
            {timePeriods.map((period) => (
              <option key={period.value} value={period.value}>
                Período: {period.label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow overflow-auto pb-0 mb-0">
        {/* Table Header */}
        <div className="sticky top-0 grid grid-cols-12 gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200 text-sm font-semibold text-gray-700">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-3">TOKEN</div>
          <div className="col-span-2 text-right">PREÇO</div>
          <div className="col-span-1 text-right">7d %</div>
          <div className="col-span-2 text-right">
            <select 
              className="text-sm font-semibold border-none bg-transparent focus:ring-0 p-0 cursor-pointer hover:text-primary transition-colors"
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
          <div className="col-span-2 text-right">MCAP</div>
          <div className="col-span-1 text-right">AÇÃO</div>
        </div>
        
        {/* Token List */}
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredTokens.map((token, index) => {
            const isSelected = selectedToken?.id === token.id;
            const isUsed = usedTokens.includes(token.id);
            
            return (
              <div 
                key={token.id} 
                className={`grid grid-cols-12 gap-2 px-4 py-3 border-b transition-colors ${
                  isUsed 
                    ? 'bg-red-50 border-red-200 opacity-60 cursor-not-allowed' 
                    : isSelected 
                      ? 'bg-primary/10 border-primary/30 cursor-pointer' 
                      : 'hover:bg-gray-50 cursor-pointer'
                }`}
                onClick={() => !isUsed && handleTokenClick(token)}
                draggable={!isUsed}
                onDragStart={(e) => !isUsed && handleDragStart(e, token)}
              >
                <div className="col-span-1 text-sm text-gray-600 text-center">
                  {index + 1}
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <Image 
                      src={token.image} 
                      alt={`${token.name} logo`} 
                      width={32} 
                      height={32} 
                      className="rounded-full shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate" title={token.name}>
                        {token.name}
                      </div>
                      <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                        {token.symbol}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 text-sm font-medium text-right">
                  {formatCurrency(token.price)}
                </div>
                
                <div className="col-span-1 text-sm font-medium text-right">
                  <span className={getPercentageColorClass(token.change_7d)}>
                    {formatPercentage(token.change_7d)}
                  </span>
                </div>
                
                <div className="col-span-2 text-sm font-medium text-right">
                  <span className={getPercentageColorClass(token.change_24h)}>
                    {formatPercentage(token.change_24h)}
                  </span>
                </div>
                
                <div className="col-span-2 text-sm font-medium text-right">
                  {formatMarketCap(token.market_cap)}
                </div>
                
                <div className="col-span-1 flex items-center justify-end">
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}