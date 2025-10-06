'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XstocksTable } from '@/components/XstocksTable';
import { useXstocksTokens, useXstocksDebug } from '@/hooks/useXstocksTokens';
import type { XStockApiItem } from '@/app/api/xstocks/route';
import { 
  TestTube, 
  Database, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

/**
 * Página de teste para a integração xStocks
 */
export default function XStocksTestPage() {
  const [selectedTokens, setSelectedTokens] = useState<XStockApiItem[]>([]);
  
  // Hook para dados normais
  const { 
    tokens, 
    loading, 
    error, 
    lastUpdated, 
    count,
    refetch 
  } = useXstocksTokens({
    minVolumeUsd: 0,
    autoFetch: true,
  });

  // Hook para debug
  const debugData = useXstocksDebug();

  /**
   * Handler para adicionar token à seleção
   */
  const handleAddToken = (token: XStockApiItem) => {
    if (!selectedTokens.find(t => t.mint === token.mint)) {
      setSelectedTokens(prev => [...prev, token]);
    }
  };

  /**
   * Handler para remover token da seleção
   */
  const handleRemoveToken = (mint: string) => {
    setSelectedTokens(prev => prev.filter(t => t.mint !== mint));
  };

  /**
   * Estatísticas dos tokens
   */
  const stats = React.useMemo(() => {
    const withPrice = tokens.filter(t => t.priceUsd !== null).length;
    const withVolume = tokens.filter(t => t.volume24hUsd !== null).length;
    const totalVolume = tokens.reduce((sum, t) => sum + (t.volume24hUsd || 0), 0);
    
    return {
      total: tokens.length,
      withPrice,
      withVolume,
      totalVolume,
      avgPrice: withPrice > 0 ? tokens.reduce((sum, t) => sum + (t.priceUsd || 0), 0) / withPrice : 0,
    };
  }, [tokens]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TestTube className="w-8 h-8" />
            Teste xStocks API
          </h1>
          <p className="text-muted-foreground mt-2">
            Teste da integração completa com scraping, CoinGecko e cache
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {loading && (
            <Badge variant="secondary" className="animate-pulse">
              <Clock className="w-3 h-3 mr-1" />
              Carregando...
            </Badge>
          )}
          {error && (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Erro
            </Badge>
          )}
          {!loading && !error && tokens.length > 0 && (
            <Badge variant="default">
              <CheckCircle className="w-3 h-3 mr-1" />
              {count} tokens
            </Badge>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com Preço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withPrice}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.withPrice / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withVolume}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.withVolume / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume Total 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <DollarSign className="w-5 h-5 mr-1" />
              {stats.totalVolume >= 1e6 
                ? `${(stats.totalVolume / 1e6).toFixed(1)}M`
                : `${(stats.totalVolume / 1e3).toFixed(1)}K`
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">
            <Database className="w-4 h-4 mr-2" />
            Tabela de Tokens
          </TabsTrigger>
          <TabsTrigger value="selected">
            <TrendingUp className="w-4 h-4 mr-2" />
            Tokens Selecionados ({selectedTokens.length})
          </TabsTrigger>
          <TabsTrigger value="debug">
            <TestTube className="w-4 h-4 mr-2" />
            Debug
          </TabsTrigger>
        </TabsList>

        {/* Tabela Principal */}
        <TabsContent value="table">
          <XstocksTable
            options={{
              minVolumeUsd: 0,
              debug: false,
              autoFetch: true,
            }}
            onAddToken={handleAddToken}
            showAddButton={true}
            showVolumeFilter={true}
            showSearch={true}
            maxHeight="500px"
          />
        </TabsContent>

        {/* Tokens Selecionados */}
        <TabsContent value="selected">
          <Card>
            <CardHeader>
              <CardTitle>Tokens Selecionados para a Liga</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTokens.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum token selecionado. Use o botão &quot;+&quot; na tabela para adicionar tokens.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedTokens.map((token) => (
                    <div 
                      key={token.mint}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{token.xSymbol}</Badge>
                        <span className="font-medium">{token.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {token.priceUsd ? `$${token.priceUsd.toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveToken(token.mint)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debug */}
        <TabsContent value="debug">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Debug</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Status da API</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Loading: {loading ? 'Sim' : 'Não'}</div>
                      <div>Error: {error || 'Nenhum'}</div>
                      <div>Última atualização: {lastUpdated || 'N/A'}</div>
                      <div>Total de tokens: {count}</div>
                    </div>
                  </div>

                  {debugData.debugInfo && (
                    <div>
                      <h4 className="font-medium mb-2">Debug Info</h4>
                      <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60">
                        {JSON.stringify(debugData.debugInfo, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Ações de Teste</h4>
                    <div className="flex gap-2">
                      <Button onClick={refetch} disabled={loading}>
                        Recarregar Dados
                      </Button>
                      <Button 
                        onClick={() => window.open('/api/xstocks?debug=true', '_blank')}
                        variant="outline"
                      >
                        Ver API Raw
                      </Button>
                      <Button 
                        onClick={() => window.open('/api/xstocks?revalidate=true&debug=true', '_blank')}
                        variant="outline"
                      >
                        Forçar Revalidação
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}