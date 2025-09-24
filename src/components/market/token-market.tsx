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

// Time period options
const timePeriods = [
  { value: 'change_5m', label: '5m' },
  { value: 'change_15m', label: '15m' },
  { value: 'change_30m', label: '30m' },
  { value: 'change_1h', label: '1h' },
  { value: 'change_4h', label: '4h' },
  { value: 'change_12h', label: '12h' },
  { value: 'change_1d', label: '1 day' },
  { value: 'change_1w', label: '1 week' }
];

interface TokenMarketProps {
  onSelectToken?: (token: Token) => void;
  selectedPosition?: string;
  selectedToken?: Token | null;
  onTokenSelect?: (token: Token | null) => void;
  usedTokens?: string[]; // Array of token IDs already used in the team
}

export function TokenMarket({ onSelectToken, selectedPosition, selectedToken, onTokenSelect, usedTokens = [] }: TokenMarketProps) {
  const { tokens, loading, error, refetch } = useTokens();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change_24h' | 'change_7d' | 'market_cap'>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [isClient, setIsClient] = useState(false);

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
      
      switch (sortBy) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'change_24h':
          comparison = a.change_24h - b.change_24h;
          break;
        case 'change_7d':
          comparison = a.change_7d - b.change_7d;
          break;
        case 'market_cap':
          comparison = a.market_cap - b.market_cap;
          break;
        default:
          comparison = a.market_cap - b.market_cap;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTokens(filtered);
  }, [tokens, searchTerm, sortBy, sortOrder]);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(4)}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  };

  const handleSort = (column: 'rank' | 'price' | 'change_24h' | 'change_7d' | 'market_cap') => {
    if (sortBy === column) {
      // Toggle order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending for most columns, ascending for rank
      setSortBy(column);
      setSortOrder(column === 'rank' ? 'asc' : 'desc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
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
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Mercado de Tokens
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              CoinGecko API
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Atualizar
            </Button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-600 border-b">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Nome</div>
          <button 
            className="col-span-2 text-left hover:text-primary transition-colors flex items-center gap-1"
            onClick={() => handleSort('price')}
          >
            Preço {getSortIcon('price')}
          </button>
          <button 
            className="col-span-2 text-left hover:text-primary transition-colors flex items-center gap-1"
            onClick={() => handleSort('change_24h')}
          >
            24h % {getSortIcon('change_24h')}
          </button>
          <button 
            className="col-span-2 text-left hover:text-primary transition-colors flex items-center gap-1"
            onClick={() => handleSort('market_cap')}
          >
            Market Cap {getSortIcon('market_cap')}
          </button>
          <div className="col-span-1">Ação</div>
        </div>
        
        {/* Token List */}
        <div className="max-h-96 overflow-y-auto">
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
                <div className="col-span-1 text-sm text-gray-600">
                  {index + 1}
                </div>
                
                <div className="col-span-4">
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
                
                <div className="col-span-2 text-sm font-medium">
                  {formatPrice(token.price)}
                </div>
                
                <div className={`col-span-2 text-sm font-medium ${getChangeColor(token.change_24h)}`}>
                  <div className="flex items-center gap-1">
                    {token.change_24h > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : token.change_24h < 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : null}
                    {token.change_24h > 0 ? '+' : ''}{token.change_24h.toFixed(2)}%
                  </div>
                </div>
                
                <div className="col-span-2 text-sm font-medium">
                  {formatMarketCap(token.market_cap)}
                </div>
                
                <div className="col-span-1">
                  <Button
                    size="sm"
                    variant={isUsed ? "destructive" : isSelected ? "default" : "outline"}
                    className={`h-6 px-2 text-xs ${
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