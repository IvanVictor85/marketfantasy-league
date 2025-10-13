'use client';

import React, { FC, ReactNode, useMemo, useCallback, createContext, useContext, useState } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

interface WalletContextProviderProps {
  children: ReactNode;
}

// Context to track transaction state
interface TransactionContextType {
  isTransactionActive: boolean;
  setTransactionActive: (active: boolean) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactionState = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactionState must be used within a WalletContextProvider');
  }
  return context;
};

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;
  const [isTransactionActive, setTransactionActive] = useState(false);

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  const onError = useCallback((error: WalletError) => {
    // Handle WalletDisconnectedError specifically - this is often expected behavior
    if (error.name === 'WalletDisconnectedError') {
      // Suppress error if transaction is active (common during transaction processing)
      if (isTransactionActive) {
        return;
      }
      // Only log if it's not during a transaction or expected disconnect
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
    } else if (error.message?.includes('Insufficient funds')) {
      console.error('Insufficient funds for transaction');
    } else if (error.message?.includes('Transaction simulation failed')) {
      console.error('Transaction simulation failed - check account balance and network');
    } else if (error.message?.includes('Blockhash not found')) {
      console.error('Network error - blockhash not found, please retry');
    } else if (error.message === 'Unexpected error' || !error.message || error.message.trim() === '') {
      console.error('Unexpected wallet error - check wallet connection and network');
    } else {
      console.error('Wallet error:', error.message);
    }
  }, [isTransactionActive]);

  return (
    <TransactionContext.Provider value={{ isTransactionActive, setTransactionActive }}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect onError={onError}>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </TransactionContext.Provider>
  );
};