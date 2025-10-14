"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';

function shorten(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnectButton({ className }: { className?: string }) {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
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

  if (publicKey) {
    return (
      <Button
        className={`bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md ${className ?? ''}`}
        onClick={() => disconnect()}
      >
        {shorten(publicKey.toBase58())}
      </Button>
    );
  }

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

  return (
    <Button
      className={`bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md ${className ?? ''}`}
      onClick={() => setVisible(true)}
    >
      Conectar Carteira
    </Button>
  );
}
