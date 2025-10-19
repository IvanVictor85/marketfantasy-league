'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Star,
  BarChart3,
  Globe,
  Clock,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useXstocksTokens } from '@/hooks/useXstocksTokens';
import type { XStockApiItem } from '@/app/api/xstocks/route';
import { TokenIcon } from '@/components/ui/token-icon';
import { formatTokenPrice } from '@/lib/utils';
import Image from 'next/image';

interface XStocksMarketProps {
  onSelectToken?: (token: XStockApiItem) => void;
  selectedToken?: XStockApiItem | null;
  className?: string;
}

export function XStocksMarket({ onSelectToken, selectedToken, className = '' }: XStocksMarketProps) {
  const { tokens, loading, error, refetch, lastUpdated, count } = useXstocksTokens({
    debug: false,
    autoFetch: true
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'name' | 'priceUsd'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filteredTokens, setFilteredTokens] = useState<XStockApiItem[]>([]);

  // Debug logs
  useEffect(() => {
    console.log('🎯 [XStocksMarket] Estado atual:', {
      tokensLength: tokens.length,
      loading,
      error,
      count,
      lastUpdated
    });
  }, [tokens, loading, error, count, lastUpdated]);

  // Filter and sort tokens
  useEffect(() => {
    console.log('🔍 [XStocksMarket] Filtrando tokens:', {
      totalTokens: tokens.length,
      searchTerm,
      sortBy,
      sortOrder
    });

    let filtered = tokens.filter(token => {
      const matchesSearch = !searchTerm || 
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.xSymbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    console.log('📊 [XStocksMarket] Tokens após filtro:', filtered.length);

    // Sort tokens
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'priceUsd':
          aValue = a.priceUsd || 0;
          bValue = b.priceUsd || 0;
          break;
        default:
          aValue = a.symbol;
          bValue = b.symbol;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    console.log('✅ [XStocksMarket] Tokens finais para renderização:', filtered.length);
    setFilteredTokens(filtered);
  }, [tokens, searchTerm, sortBy, sortOrder]);

  const handleTokenSelect = (token: XStockApiItem) => {
    onSelectToken?.(token);
  };

  // Usando formatTokenPrice do utils para formatação consistente

  const formatVolume = (volume: number | null) => {
    if (volume === null) return 'N/A';
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                xStocks Market
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Tokens disponíveis na plataforma xStocks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {count} tokens
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por símbolo ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="symbol">Símbolo</option>
                <option value="name">Nome</option>
                <option value="priceUsd">Preço</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Status */}
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Clock className="w-4 h-4" />
              Última atualização: {new Date(lastUpdated).toLocaleString('pt-BR')}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro ao carregar tokens: {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Carregando tokens...
            </div>
          )}

          {/* Tokens List */}
          {!loading && !error && (
            <div className="space-y-2">
              {filteredTokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhum token encontrado para a busca.' : 'Nenhum token disponível.'}
                </div>
              ) : (
                filteredTokens.map((token) => (
                  <Card 
                    key={token.mint}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedToken?.mint === token.mint ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleTokenSelect(token)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {token.image ? (
                            <Image 
                              src={token.image} 
                              alt={`${token.name} logo`} 
                              width={40} 
                              height={40} 
                              className="rounded-full shadow-sm"
                            />
                          ) : (
                            <TokenIcon symbol={token.symbol} size={40} />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{token.symbol}</span>
                              <Badge variant="outline" className="text-xs">
                                {token.xSymbol}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{token.name}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatTokenPrice(token.priceUsd)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Vol: {formatVolume(token.volume24hUsd)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {token.sources.xstocks && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              xStocks
                            </Badge>
                          )}
                          {token.sources.coingecko && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              CoinGecko
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(token.links.solscan, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}