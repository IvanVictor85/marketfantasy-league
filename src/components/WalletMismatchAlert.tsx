"use client";

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wallet, ArrowRight } from 'lucide-react';
import { useAppWalletStatus } from '@/hooks/useAppWalletStatus';

/**
 * Componente de Alerta de Incompatibilidade de Carteira
 * 
 * Exibe um alerta visual proeminente quando há incompatibilidade
 * entre a carteira do perfil e a carteira conectada na extensão.
 */
export function WalletMismatchAlert() {
  const { isMismatched, profileWallet, connectedWallet, mismatchDetails } = useAppWalletStatus();

  if (!isMismatched) {
    return null;
  }

  return (
    <Alert className="border-yellow-500 bg-yellow-50 text-yellow-800 mb-4">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold mb-1">
            ⚠️ Carteira Incompatível Detectada
          </div>
          <div className="text-sm">
            Sua conta está vinculada à carteira{' '}
            <span className="font-mono font-semibold bg-yellow-100 px-2 py-1 rounded">
              {mismatchDetails?.profileWalletShort}
            </span>
            , mas você está conectado à{' '}
            <span className="font-mono font-semibold bg-yellow-100 px-2 py-1 rounded">
              {mismatchDetails?.connectedWalletShort}
            </span>
            .
          </div>
          <div className="text-sm mt-2">
            <strong>Para continuar:</strong> Troque de carteira na sua extensão (Phantom/Solflare) 
            para a carteira correta ou desconecte a carteira atual.
          </div>
        </div>
        <div className="flex items-center text-yellow-600 ml-4">
          <Wallet className="h-4 w-4 mr-1" />
          <ArrowRight className="h-3 w-3" />
        </div>
      </AlertDescription>
    </Alert>
  );
}
