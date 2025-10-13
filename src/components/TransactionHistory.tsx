'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useEnhancedTransactions,
  useTransactionAnalytics,
} from '@/hooks/useEnhancedTransactions';
import {
  EnhancedTransaction,
  formatTransactionType,
  formatTransactionSource,
  getTransactionAge,
  isSuccessfulTransaction,
} from '@/lib/helius/enhanced-transactions';
import { lamportsToSol } from '@/lib/solana/connection';

interface TransactionHistoryProps {
  className?: string;
  limit?: number;
  autoRefresh?: boolean;
  showAnalytics?: boolean;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  className = '',
  limit = 50,
  autoRefresh = false,
  showAnalytics = true,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const {
    transactions,
    loading,
    error,
    hasMore,
    totalFees,
    balanceChanges,
    solTransfers,
    tokenTransfers,
    refreshTransactions,
    loadMoreTransactions,
    filterByType,
  } = useEnhancedTransactions({
    limit,
    autoRefresh,
  });

  const analytics = useTransactionAnalytics(transactions);

  const filteredTransactions = selectedType === 'all' 
    ? transactions 
    : filterByType(selectedType);

  const handleRefresh = async () => {
    await refreshTransactions();
  };

  const handleLoadMore = async () => {
    await loadMoreTransactions();
  };

  const toggleTransactionDetails = (signature: string) => {
    setExpandedTx(expandedTx === signature ? null : signature);
  };

  const getTransactionStatusColor = (tx: EnhancedTransaction) => {
    if (isSuccessfulTransaction(tx)) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'TRANSFER':
        return <TrendingUp className="h-4 w-4" />;
      case 'SWAP':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatSolAmount = (lamports: number) => {
    const sol = lamportsToSol(lamports);
    return `${sol.toFixed(4)} SOL`;
  };

  const openInExplorer = (signature: string) => {
    window.open(`https://explorer.solana.com/tx/${signature}`, '_blank');
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Erro ao carregar transações: {error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          {showAnalytics && (
            <TabsTrigger value="analytics">Análises</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Histórico de Transações
                </CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="all">Todos os Tipos</option>
                    <option value="TRANSFER">Transferências</option>
                    <option value="SWAP">Trocas</option>
                    <option value="NFT_SALE">Vendas NFT</option>
                    <option value="STAKE">Stake</option>
                  </select>
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading && transactions.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Carregando transações...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Nenhuma transação encontrada</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {filteredTransactions.map((tx) => (
                      <div
                        key={tx.signature}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100">
                              {getTransactionTypeIcon(tx.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {formatTransactionType(tx.type)}
                                </span>
                                <Badge
                                  className={getTransactionStatusColor(tx)}
                                  variant="outline"
                                >
                                  {isSuccessfulTransaction(tx) ? 'Sucesso' : 'Falhou'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500">
                                {formatTransactionSource(tx.source)} • {getTransactionAge(tx)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-medium">
                                {formatSolAmount(tx.fee || 0)}
                              </p>
                              <p className="text-sm text-gray-500">Taxa</p>
                            </div>
                            <Button
                              onClick={() => toggleTransactionDetails(tx.signature)}
                              size="sm"
                              variant="ghost"
                            >
                              {expandedTx === tx.signature ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              onClick={() => openInExplorer(tx.signature)}
                              size="sm"
                              variant="ghost"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {expandedTx === tx.signature && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium">Assinatura:</p>
                                <p className="text-gray-600 font-mono text-xs break-all">
                                  {tx.signature}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">Slot:</p>
                                <p className="text-gray-600">{tx.slot}</p>
                              </div>
                            </div>

                            {tx.description && (
                              <div>
                                <p className="font-medium text-sm">Descrição:</p>
                                <p className="text-gray-600 text-sm">{tx.description}</p>
                              </div>
                            )}

                            {tx.nativeTransfers && tx.nativeTransfers.length > 0 && (
                              <div>
                                <p className="font-medium text-sm mb-2">Transferências SOL:</p>
                                <div className="space-y-1">
                                  {tx.nativeTransfers.map((transfer, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                                    >
                                      <span>
                                        {transfer.fromUserAccount.slice(0, 8)}... →{' '}
                                        {transfer.toUserAccount.slice(0, 8)}...
                                      </span>
                                      <span className="font-medium">
                                        {formatSolAmount(transfer.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {tx.tokenTransfers && tx.tokenTransfers.length > 0 && (
                              <div>
                                <p className="font-medium text-sm mb-2">Transferências de Token:</p>
                                <div className="space-y-1">
                                  {tx.tokenTransfers.map((transfer, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                                    >
                                      <span>
                                        {transfer.fromUserAccount.slice(0, 8)}... →{' '}
                                        {transfer.toUserAccount.slice(0, 8)}...
                                      </span>
                                      <span className="font-medium">
                                        {transfer.tokenAmount} {transfer.mint.slice(0, 8)}...
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {hasMore && (
                    <div className="text-center mt-4">
                      <Button
                        onClick={handleLoadMore}
                        disabled={loading}
                        variant="outline"
                      >
                        {loading ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Carregar Mais
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showAnalytics && (
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total de Transações</p>
                      <p className="text-2xl font-bold">{analytics.totalTransactions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Volume Total</p>
                      <p className="text-2xl font-bold">
                        {formatSolAmount(analytics.totalVolume)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Taxas Totais</p>
                      <p className="text-2xl font-bold">
                        {formatSolAmount(analytics.totalFees)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                      <p className="text-2xl font-bold">
                        {analytics.successRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transações por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.transactionsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm">{formatTransactionType(type)}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transações por Fonte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.transactionsBySource).map(([source, count]) => (
                      <div key={source} className="flex justify-between items-center">
                        <span className="text-sm">{formatTransactionSource(source)}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};