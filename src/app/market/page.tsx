'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/navbar';
import { TokenMarket } from '@/components/market/token-market';
import { type TokenMarketData } from '@/data/expanded-tokens';
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

export default function MarketPage() {
  const [selectedToken, setSelectedToken] = useState<TokenMarketData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleTokenSelect = (token: TokenMarketData | null) => {
    setSelectedToken(token);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                Mercado de Tokens
              </h1>
              <p className="text-gray-600 mt-2">
                Explore e analise os tokens disponíveis para montar seu time
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Dados em Tempo Real
              </Badge>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Tokens</p>
                    <p className="text-2xl font-bold text-gray-900">100</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Em Alta (24h)</p>
                    <p className="text-2xl font-bold text-green-600">67</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tokens Raros</p>
                    <p className="text-2xl font-bold text-purple-600">23</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Volume 24h</p>
                    <p className="text-2xl font-bold text-orange-600">$2.1B</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Globe className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Market Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token Market - Main Content */}
          <div className="lg:col-span-2">
            <TokenMarket 
              selectedToken={selectedToken}
              onTokenSelect={handleTokenSelect}
            />
          </div>

          {/* Token Details Sidebar */}
          <div className="space-y-6">
            {selectedToken ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {selectedToken.symbol.charAt(0)}
                      </span>
                    </div>
                    {selectedToken.name}
                  </CardTitle>
                  <CardDescription>
                    Detalhes do token selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Símbolo</p>
                      <p className="font-semibold">{selectedToken.symbol}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ranking</p>
                      <p className="font-semibold">#{selectedToken.rank}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Preço Atual</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${selectedToken.price.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 6 
                      })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">24h</p>
                      <p className={`font-semibold ${
                        (selectedToken.change_24h || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(selectedToken.change_24h || 0) > 0 ? '+' : ''}{(selectedToken.change_24h || 0).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">7 dias</p>
                      <p className={`font-semibold ${
                        (selectedToken.change_7d || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(selectedToken.change_7d || 0) > 0 ? '+' : ''}{(selectedToken.change_7d || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Market Cap</p>
                    <p className="font-semibold">
                      ${((selectedToken.market_cap || 0) / 1e9).toFixed(2)}B
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Volume 24h</p>
                    <p className="font-semibold">
                      ${((selectedToken.volume_24h || 0) / 1e6).toFixed(2)}M
                    </p>
                  </div>

                  {selectedToken.rarity && (
                    <div>
                      <p className="text-sm text-gray-600">Raridade</p>
                      <Badge 
                        variant={
                          selectedToken.rarity === 'legendary' ? 'default' :
                          selectedToken.rarity === 'epic' ? 'secondary' :
                          selectedToken.rarity === 'rare' ? 'outline' : 'secondary'
                        }
                        className={
                          selectedToken.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                          selectedToken.rarity === 'epic' ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white' :
                          selectedToken.rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white' :
                          'bg-gray-100 text-gray-700'
                        }
                      >
                        {selectedToken.rarity.charAt(0).toUpperCase() + selectedToken.rarity.slice(1)}
                      </Badge>
                    </div>
                  )}

                  <Button className="w-full" size="sm">
                    Adicionar ao Time
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Selecione um Token
                  </h3>
                  <p className="text-gray-600">
                    Clique em um token na lista para ver seus detalhes aqui
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros Avançados
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Dados
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Star className="w-4 h-4 mr-2" />
                  Meus Favoritos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}