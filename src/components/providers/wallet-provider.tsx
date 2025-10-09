'use client';

import React, { FC, ReactNode, useMemo, useCallback } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
      return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    }
    return clusterApiUrl(network);
  }, [network]);

  // Configure wallets for Solana
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  const onError = useCallback((error: WalletError) => {
    console.error('Wallet error:', error);
    
    // Handle WalletDisconnectedError specifically
    if (error.name === 'WalletDisconnectedError') {
      console.log('Wallet disconnected - this is expected behavior');
      return;
    }
    
    // Handle specific error types
    if (error.message?.includes('User rejected') || error.message?.includes('rejected the request')) {
      console.log('User cancelled wallet connection');
      // Don't show error toast for user cancellation
      return;
    }
    
    // Handle empty error messages
    if (!error.message || error.message.trim() === '') {
      console.warn('Wallet error with empty message:', error.name || 'Unknown error');
      return;
    }
    
    // Handle other wallet errors
    if (error.message?.includes('Wallet not found')) {
      console.error('Wallet not found - please install a Solana wallet');
    } else if (error.message?.includes('Connection failed')) {
      console.error('Failed to connect to wallet');
    } else {
      console.error('Unexpected wallet error:', error.message);
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};