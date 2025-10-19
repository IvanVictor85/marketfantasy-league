'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatTokenPrice } from '@/lib/utils';
import { 
  Search, 
  ExternalLink, 
  Plus, 
  TrendingUp, 
  DollarSign,
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useXstocksTokens, type UseXstocksTokensOptions } from '@/hooks/useXstocksTokens';
import type { XStockApiItem } from '@/app/api/xstocks/route';

export interface XstocksTableProps {
  options?: UseXstocksTokensOptions;
  onAddToken?: (token: XStockApiItem) => void;
  showAddButton?: boolean;
  showVolumeFilter?: boolean;
  showSearch?: boolean;
  maxHeight?: string;
  className?: string;
}

type SortField = 'name' | 'symbol' | 'priceUsd' | 'volume24hUsd';
type SortDirection = 'asc' | 'desc';

/**
 * Formata valores monetários
 */
function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A';
  
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

// Usando formatTokenPrice do utils para formatação consistente

/**
 * Componente de loading para a tabela
 */
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-32 flex-1" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Componente principal da tabela de tokens xStocks
 */
export function XstocksTable({
  options = {},
  onAddToken,
  showAddButton = true,
  showVolumeFilter = true,
  showSearch = true,
  maxHeight = '600px',
  className = '',
}: XstocksTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [volumeFilter, setVolumeFilter] = useState(options.minVolumeUsd || 0);
  const [sortField, setSortField] = useState<SortField>('volume24hUsd');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Usar o hook com opções dinâmicas
  const hookOptions = useMemo(() => ({
    ...options,
    minVolumeUsd: volumeFilter,
  }), [options, volumeFilter]);

  const { tokens, loading, error, lastUpdated, refetch, debugInfo } = useXstocksTokens(hookOptions);

  // Filtrar e ordenar tokens
  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens;

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(token => 
        token.name.toLowerCase().includes(term) ||
        token.symbol.toLowerCase().includes(term) ||
        token.xSymbol.toLowerCase().includes(term)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Tratar valores null
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Ordenação por string
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tokens, searchTerm, sortField, sortDirection]);

  /**
   * Alterna ordenação
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  /**
   * Renderiza ícone de ordenação
   */
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tokens xStocks
            {tokens.length > 0 && (
              <Badge variant="secondary">{tokens.length}</Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Atualizado: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou símbolo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {showVolumeFilter && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Volume mín. (USD)"
                value={volumeFilter || ''}
                onChange={(e) => setVolumeFilter(Number(e.target.value) || 0)}
                className="w-40"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <TableSkeleton />
        ) : filteredAndSortedTokens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {tokens.length === 0 ? 'Nenhum token encontrado' : 'Nenhum token corresponde aos filtros'}
          </div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight }}>
            <div className="space-y-2">
              {/* Header da tabela */}
              <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm">
                <div 
                  className="col-span-2 cursor-pointer flex items-center gap-1 hover:text-primary"
                  onClick={() => handleSort('symbol')}
                >
                  Símbolo {renderSortIcon('symbol')}
                </div>
                <div 
                  className="col-span-3 cursor-pointer flex items-center gap-1 hover:text-primary"
                  onClick={() => handleSort('name')}
                >
                  Nome {renderSortIcon('name')}
                </div>
                <div 
                  className="col-span-2 cursor-pointer flex items-center gap-1 hover:text-primary"
                  onClick={() => handleSort('priceUsd')}
                >
                  Preço {renderSortIcon('priceUsd')}
                </div>
                <div 
                  className="col-span-2 cursor-pointer flex items-center gap-1 hover:text-primary"
                  onClick={() => handleSort('volume24hUsd')}
                >
                  Volume 24h {renderSortIcon('volume24hUsd')}
                </div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Ações</div>
              </div>

              {/* Linhas da tabela */}
              {filteredAndSortedTokens.map((token) => (
                <div 
                  key={token.mint} 
                  className="grid grid-cols-12 gap-4 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  {/* Símbolo */}
                  <div className="col-span-2">
                    <div className="font-mono font-medium">{token.xSymbol}</div>
                    <div className="text-xs text-muted-foreground">{token.symbol}</div>
                  </div>

                  {/* Nome */}
                  <div className="col-span-3">
                    <div className="font-medium truncate" title={token.name}>
                      {token.name}
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono">
                        {formatTokenPrice(token.priceUsd)}
                      </span>
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="col-span-2">
                    <div className="font-mono">
                      {formatCurrency(token.volume24hUsd)}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      xStocks
                    </Badge>
                    {token.sources.coingecko && (
                      <Badge variant="secondary" className="text-xs">
                        CG
                      </Badge>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="col-span-1 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={token.links.solscan}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver no Solscan"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>

                    {showAddButton && onAddToken && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddToken(token)}
                        className="h-8 w-8 p-0"
                        title="Adicionar token"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug info */}
        {debugInfo && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Debug Info
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

export default XstocksTable;