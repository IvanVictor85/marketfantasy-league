'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Zap, 
  Webhook, 
  TrendingUp, 
  Clock,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { TransactionHistory } from '@/components/TransactionHistory';
import { WebhookManager } from '@/components/WebhookManager';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { usePriorityFee } from '@/hooks/usePriorityFee';

export default function HeliusDemoPage() {
  const { connected, publicKey } = useWallet();
  const [testAddress, setTestAddress] = useState('');
  
  const {
    priorityFee,
    loading: feeLoading,
    error: feeError,
    refreshPriorityFee
  } = usePriorityFee();

  const handleTestAddress = () => {
    if (testAddress) {
      // This would trigger a test with the provided address
      console.log('Testing with address:', testAddress);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Helius API Integration Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Demonstração completa da integração com a Helius API para funcionalidades avançadas da blockchain Solana
          </p>
        </div>

        {/* Wallet Connection */}
        <Card className="border-2 border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Conexão da Carteira
            </CardTitle>
            <CardDescription>
              Conecte sua carteira Solana para testar as funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                {connected && publicKey ? (
                  <div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Desconectado
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      Conecte sua carteira para acessar todas as funcionalidades
                    </p>
                  </div>
                )}
              </div>
              <WalletMultiButton />
            </div>
          </CardContent>
        </Card>

        {/* Priority Fee Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Priority Fee API
            </CardTitle>
            <CardDescription>
              Estimativas de taxa de prioridade em tempo real para otimização de custos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Baixa</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {feeLoading ? '...' : `${priorityFee?.priorityFeeLevels?.low || 0} µSOL`}
                </p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Média</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700">
                  {feeLoading ? '...' : `${priorityFee?.priorityFeeLevels?.medium || 0} µSOL`}
                </p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-900">Alta</span>
                </div>
                <p className="text-2xl font-bold text-red-700">
                  {feeLoading ? '...' : `${priorityFee?.priorityFeeLevels?.high || 0} µSOL`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={refreshPriorityFee} 
                disabled={feeLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${feeLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              {feeError && (
                <Alert className="flex-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{feeError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Address Input */}
        <Card>
          <CardHeader>
            <CardTitle>Teste com Endereço Personalizado</CardTitle>
            <CardDescription>
              Insira um endereço Solana para testar as funcionalidades sem conectar carteira
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="test-address">Endereço Solana</Label>
                <Input
                  id="test-address"
                  placeholder="Ex: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
                  value={testAddress}
                  onChange={(e) => setTestAddress(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleTestAddress} disabled={!testAddress}>
                  Testar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Enhanced Transactions
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Transactions API</CardTitle>
                <CardDescription>
                  Histórico detalhado de transações com análise avançada e informações enriquecidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connected ? (
                  <TransactionHistory 
                    limit={20}
                    autoRefresh={true}
                    showAnalytics={true}
                  />
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Conecte sua carteira para visualizar o histórico de transações
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Webhooks Management</CardTitle>
                <CardDescription>
                  Gerencie webhooks para notificações em tempo real de eventos da blockchain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WebhookManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Analytics</CardTitle>
                <CardDescription>
                  Análises e métricas avançadas baseadas no histórico de transações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Total de Transações</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">-</p>
                    <p className="text-sm text-blue-600">Últimos 30 dias</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Taxa de Sucesso</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">-</p>
                    <p className="text-sm text-green-600">Transações bem-sucedidas</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Total em Taxas</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">- SOL</p>
                    <p className="text-sm text-purple-600">Taxas pagas</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-orange-900">Última Atividade</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">-</p>
                    <p className="text-sm text-orange-600">Tempo decorrido</p>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Conecte sua carteira para visualizar analytics detalhados
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Integração Helius API Completa
              </h3>
              <p className="text-gray-600">
                Esta demonstração showcases todas as funcionalidades implementadas da Helius API
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Badge variant="outline" className="bg-white">
                  Enhanced Transactions ✓
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Webhooks ✓
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Priority Fees ✓
                </Badge>
                <Badge variant="outline" className="bg-white">
                  Analytics ✓
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}