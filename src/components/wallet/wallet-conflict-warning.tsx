'use client';

import { useExtensionDetector } from '@/hooks/use-extension-detector';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function WalletConflictWarning() {
  const { conflictDetected, hasMetaMask, hasPhantom } = useExtensionDetector();
  const [dismissed, setDismissed] = useState(false);

  if (!conflictDetected || dismissed) {
    return null;
  }

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <div className="flex-1">
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">
          Múltiplas Carteiras Detectadas
        </AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          Detectamos que você tem {hasMetaMask && 'MetaMask'} e {hasPhantom && 'Phantom'} instalados. 
          Esta aplicação usa <strong>Solana</strong>, então recomendamos usar apenas a <strong>Phantom</strong> para evitar conflitos.
          {hasMetaMask && (
            <div className="mt-2 text-sm">
              💡 <strong>Dica:</strong> Você pode desabilitar temporariamente o MetaMask para esta aplicação nas configurações da extensão.
            </div>
          )}
        </AlertDescription>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDismissed(true)}
        className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}