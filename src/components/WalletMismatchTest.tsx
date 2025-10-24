"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppWalletStatus } from '@/hooks/useAppWalletStatus';
import { useGuardedActionHook } from '@/hooks/useGuardedActionHook';
import { Wallet, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Componente de Teste para Wallet Mismatch
 * 
 * Este componente demonstra o funcionamento do sistema de segurança
 * e permite testar diferentes cenários de incompatibilidade.
 */
export function WalletMismatchTest() {
  const walletStatus = useAppWalletStatus();
  const { canExecuteAction, showMismatchAlert } = useGuardedActionHook();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAction = () => {
    addTestResult('🧪 Testando ação de transação...');
    
    if (canExecuteAction()) {
      addTestResult('✅ Ação permitida - carteiras compatíveis');
    } else {
      addTestResult('❌ Ação bloqueada - carteiras incompatíveis');
      showMismatchAlert();
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Status da Carteira
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Carteira do Perfil
              </label>
              <div className="font-mono text-sm bg-muted p-2 rounded">
                {walletStatus.profileWallet ? 
                  `${walletStatus.profileWallet.slice(0, 8)}...${walletStatus.profileWallet.slice(-8)}` : 
                  'Nenhuma'
                }
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Carteira Conectada
              </label>
              <div className="font-mono text-sm bg-muted p-2 rounded">
                {walletStatus.connectedWallet ? 
                  `${walletStatus.connectedWallet.slice(0, 8)}...${walletStatus.connectedWallet.slice(-8)}` : 
                  'Nenhuma'
                }
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {walletStatus.isMismatched ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Incompatível
              </Badge>
            ) : walletStatus.connectedWallet ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Compatível
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Desconectado
              </Badge>
            )}
          </div>

          {walletStatus.isMismatched && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Incompatibilidade detectada!</strong><br />
                A carteira conectada não é a mesma vinculada ao seu perfil.
                Ações de transação serão bloqueadas até que você conecte a carteira correta.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testAction} className="flex-1">
              Testar Ação de Transação
            </Button>
            <Button onClick={clearResults} variant="outline">
              Limpar Logs
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Log de Testes:</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instruções de Teste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="space-y-2">
            <div><strong>1. Cenário Normal:</strong> Faça login e conecte a carteira correta</div>
            <div><strong>2. Cenário de Incompatibilidade:</strong> Conecte uma carteira diferente na Phantom</div>
            <div><strong>3. Teste de Ação:</strong> Clique em "Testar Ação de Transação" para ver o bloqueio</div>
            <div><strong>4. Verificação Visual:</strong> Observe o botão de carteira no header mudando de cor</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
