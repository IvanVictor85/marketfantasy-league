'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { TokenMarket } from '@/components/market/token-market';
import { XStocksMarket } from '@/components/market/xstocks-market';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type TokenMarketData } from '@/data/expanded-tokens';
import type { XStockApiItem } from '@/app/api/xstocks/route';
import { 
  TrendingUp, 
  BarChart3, 
  Globe, 
  Star,
  Filter,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useMarketTranslations, useCommonTranslations } from '@/hooks/useTranslations';

export default function MarketPage() {
  const [selectedToken, setSelectedToken] = useState<TokenMarketData | null>(null);
  const [selectedXStockToken, setSelectedXStockToken] = useState<XStockApiItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('xstocks');

  // Traduções
  const tMarket = useMarketTranslations();
  const tCommon = useCommonTranslations();

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
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
            <div className="text-2xl font-bold">SOL</div>
            <p className="text-xs text-green-600">
              +15.7% {tCommon('today')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="xstocks">XStocks Market</TabsTrigger>
          <TabsTrigger value="tokens">Token Market</TabsTrigger>
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