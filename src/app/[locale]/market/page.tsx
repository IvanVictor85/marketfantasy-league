'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { TokenMarket } from '@/components/market/token-market';
import { XStocksMarket } from '@/components/market/xstocks-market';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type TokenMarketData } from '@/data/expanded-tokens';
import type { XStockApiItem } from '@/app/api/xstocks/route';
import { getMarketAnalysisData, type MarketAnalysisData, type MarketToken } from '@/lib/market-analysis';
import { 
  TrendingUp, 
  BarChart3, 
  Globe, 
  Star,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { useMarketTranslations, useCommonTranslations } from '@/hooks/useTranslations';

export default function MarketPage() {
  const [selectedToken, setSelectedToken] = useState<TokenMarketData | null>(null);
  const [selectedXStockToken, setSelectedXStockToken] = useState<XStockApiItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('xstocks');
  
  // Estados para análise de mercado
  const [marketData, setMarketData] = useState<MarketAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Traduções
  const tMarket = useMarketTranslations();
  const tCommon = useCommonTranslations();

  // Função para carregar dados de análise de mercado (com AbortSignal opcional)
  const loadMarketData = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMarketAnalysisData(signal);
      setMarketData(data);
    } catch (err) {
      // Ignorar abortos provocados por HMR ou navegação
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    const controller = new AbortController();
    loadMarketData(controller.signal);
    return () => controller.abort();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const controller = new AbortController();
    await loadMarketData(controller.signal);
    setRefreshing(false);
  }; 

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{tMarket('title')}</h1>
          <p className="text-muted-foreground">
            {tMarket('subtitle')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {tCommon('refresh')}
          </Button>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            {tCommon('filter')}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tMarket('totalMarketCap')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4T</div>
            <p className="text-xs text-muted-foreground">
              +2.5% {tCommon('from')} {tCommon('yesterday')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tMarket('volume24h')}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$89.2B</div>
            <p className="text-xs text-muted-foreground">
              -1.2% {tCommon('from')} {tCommon('yesterday')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tMarket('activeTokens')}
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              +12 {tCommon('new')} {tCommon('today')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tMarket('topGainer')}
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {marketData?.topGainers && marketData.topGainers.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{marketData.topGainers[0].symbol}</div>
                <p className="text-xs text-green-600">
                  +{marketData.topGainers[0].priceChange24h.toFixed(2)}% {tCommon('today')}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">SOL</div>
                <p className="text-xs text-green-600">
                  +15.7% {tCommon('today')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="xstocks">XStocks Market</TabsTrigger>
          <TabsTrigger value="tokens">Token Market</TabsTrigger>
          <TabsTrigger value="analysis">Análise de Mercado</TabsTrigger>
        </TabsList>
        
        <TabsContent value="xstocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                XStocks Market
              </CardTitle>
              <CardDescription>
                {tMarket('xstocksDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <XStocksMarket 
                selectedToken={selectedXStockToken}
                onSelectToken={setSelectedXStockToken}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {tMarket('cryptoMarket')}
              </CardTitle>
              <CardDescription>
                {tMarket('cryptoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TokenMarket 
                selectedToken={selectedToken}
                onTokenSelect={setSelectedToken}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análise de Mercado - TOP 100 Tokens
              </CardTitle>
              <CardDescription>
                Análise em tempo real dos maiores ganhadores e perdedores do mercado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Carregando dados...</span>
                </div>
              )}
              
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">Erro: {error}</span>
                </div>
              )}
              
              {marketData && !loading && !error && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ganhadores */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-5 w-5" />
                      Maiores Ganhadores ({marketData.topGainers.length})
                    </h3>
                    <div className="space-y-3">
                      {marketData.topGainers.slice(0, 10).map((token: MarketToken) => (
                        <div key={token.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            {token.logoUrl && (
                              <img src={token.logoUrl} alt={token.name} className="w-8 h-8 rounded-full" />
                            )}
                            <div>
                              <div className="font-medium">{token.name}</div>
                              <div className="text-sm text-gray-600">{token.symbol}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${token.currentPrice.toFixed(4)}</div>
                            <div className="text-sm text-green-600 font-medium">
                              +{token.priceChange24h.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Perdedores */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
                      <TrendingDown className="h-5 w-5" />
                      Maiores Perdedores ({marketData.topLosers.length})
                    </h3>
                    <div className="space-y-3">
                      {marketData.topLosers.slice(0, 10).map((token: MarketToken) => (
                        <div key={token.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            {token.logoUrl && (
                              <img src={token.logoUrl} alt={token.name} className="w-8 h-8 rounded-full" />
                            )}
                            <div>
                              <div className="font-medium">{token.name}</div>
                              <div className="text-sm text-gray-600">{token.symbol}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${token.currentPrice.toFixed(4)}</div>
                            <div className="text-sm text-red-600 font-medium">
                              {token.priceChange24h.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert for demo */}
      <Card className="border-accent bg-muted">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-orange-800">
              <strong>Demo Mode:</strong> {tMarket('demoNotice')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}