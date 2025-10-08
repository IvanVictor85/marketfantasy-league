"use client";

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';

function shorten(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnectButton({ className }: { className?: string }) {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (publicKey) {
    return (
      <Button
        className={`bg-[#F7931A] hover:bg-[#d87e12] text-white rounded-xl shadow-md ${className ?? ''}`}
        onClick={() => disconnect()}
      >
        {shorten(publicKey.toBase58())}
      </Button>
    );
  }

  if (connecting) {
    return (
      <Button
        className={`bg-[#F7931A] text-white rounded-xl shadow-md ${className ?? ''}`}
        disabled
      >
        Conectando...
      </Button>
    );
  }

  return (
    <Button
      className={`bg-[#F7931A] hover:bg-[#d87e12] text-white rounded-xl shadow-md ${className ?? ''}`}
      onClick={() => setVisible(true)}
    >
      Conectar Carteira
    </Button>
  );
}
