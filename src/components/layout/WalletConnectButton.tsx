"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Wallet } from 'lucide-react';
import { useAppWalletStatus } from '@/hooks/useAppWalletStatus';

function shorten(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnectButton({ className }: { className?: string }) {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const { isMismatched, profileWallet, connectedWallet, mismatchDetails, isProfileLoading } = useAppWalletStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        className={`bg-primary text-primary-foreground rounded-xl shadow-md ${className ?? ''}`}
        disabled
      >
        Conectar Carteira
      </Button>
    );
  }

  // Estado de incompatibilidade - ALERTA CRÍTICO
  if (isMismatched && publicKey) {
    const alertMessage = `Atenção: A carteira conectada (${mismatchDetails?.connectedWalletShort}) não é a mesma vinculada ao seu perfil (${mismatchDetails?.profileWalletShort}). Por favor, troque de carteira na sua extensão (Phantom/Solflare) para a carteira correta.`;
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={`bg-yellow-500 hover:bg-yellow-600 text-yellow-900 border-2 border-yellow-600 rounded-xl shadow-md font-semibold ${className ?? ''}`}
            onClick={() => disconnect()}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {shorten(publicKey.toBase58())}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm p-3">
          <div className="text-sm">
            <div className="font-semibold text-yellow-800 mb-2">⚠️ Carteira Incompatível</div>
            <div className="text-yellow-700">{alertMessage}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Carteira conectada normalmente
  if (publicKey) {
    return (
      <Button
        className={`bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-md ${className ?? ''}`}
        onClick={() => disconnect()}
      >
        <Wallet className="w-4 h-4 mr-2" />
        {shorten(publicKey.toBase58())}
      </Button>
    );
  }

  // Estado de conexão
  if (connecting) {
    return (
      <Button
        className={`bg-primary text-primary-foreground rounded-xl shadow-md ${className ?? ''}`}
        disabled
      >
        Conectando...
      </Button>
    );
  }

  // Botão de conectar
  return (
    <Button
      className={`bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-md ${className ?? ''}`}
      onClick={() => setVisible(true)}
    >
      <Wallet className="w-4 h-4 mr-2" />
      Conectar Carteira
    </Button>
  );
}
