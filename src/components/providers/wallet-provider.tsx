'use client';

import React, { FC, ReactNode, useMemo, useCallback, createContext, useContext, useState, useEffect } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError, Adapter } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  useWalletModal,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

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

// Wrapper interno para acessar o useWallet hook
const WalletConnectHandler: FC<{ children: ReactNode }> = ({ children }) => {
  const { select, connect, connected, publicKey, wallets } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    const handlePhantomClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      if (button?.textContent?.includes('Phantom')) {
        e.preventDefault();
        e.stopPropagation();

        // Encontra o adapter Phantom
        const phantomWallet = wallets.find(w =>
          w.adapter.name === 'Phantom' || w.adapter.name === 'PhantomDetected'
        );

        if (phantomWallet) {
          try {
            await select(phantomWallet.adapter.name);
            // Aguardar um pouco para garantir que a seleção completou
            await new Promise(resolve => setTimeout(resolve, 100));
            await connect();
            // Fechar o modal após conexão bem-sucedida
            setVisible(false);
          } catch (err) {
            console.error('❌ Erro ao conectar:', err);
          }
        }
      }
    };

    document.addEventListener('click', handlePhantomClick, true);
    return () => document.removeEventListener('click', handlePhantomClick, true);
  }, [select, connect, wallets, setVisible]);

  useEffect(() => {
    if (connected && publicKey) {
      console.log('✅ Wallet conectada!', publicKey.toBase58());
    }
  }, [connected, publicKey]);

  return <>{children}</>;
};

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;
  const [isTransactionActive, setTransactionActive] = useState(false);

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Log de conexão iniciada
  const handleConnect = useCallback(() => {
    console.log('🔵 [WALLET] Tentativa de conexão iniciada');
  }, []);

  // Log de desconexão
  const handleDisconnect = useCallback(() => {
    console.log('🔴 [WALLET] Desconectado');
  }, []);


  const wallets = useMemo<Adapter[]>(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
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

    // Handle WalletDisconnectionError - bug no StandardWalletAdapter
    if (error.name === 'WalletDisconnectionError' && error.message?.includes('disconnect is not a function')) {
      console.log('⚠️ Ignorando erro de desconexão do StandardWalletAdapter');
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
      console.warn('⚠️ Wallet error with empty message:', error.name || 'Unknown error', error);
      return;
    }

    // Handle other wallet errors
    if (error.message?.includes('Wallet not found')) {
      console.error('❌ Wallet not found - please install a Solana wallet');
    } else if (error.message?.includes('Connection failed')) {
      console.error('❌ Failed to connect to wallet');
    } else if (error.message?.includes('Insufficient funds')) {
      console.error('❌ Insufficient funds for transaction');
    } else if (error.message?.includes('Transaction simulation failed')) {
      console.error('❌ Transaction simulation failed - check account balance and network');
    } else if (error.message?.includes('Blockhash not found')) {
      console.error('❌ Network error - blockhash not found, please retry');
    } else if (error.message === 'Unexpected error' || !error.message || error.message.trim() === '') {
      console.error('❌ Unexpected wallet error - check wallet connection and network', error);
    } else {
      console.error('❌ Wallet error:', error.message, error);
    }
  }, [isTransactionActive]);

  return (
    <TransactionContext.Provider value={{ isTransactionActive, setTransactionActive }}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider
          wallets={wallets}
          autoConnect={true}
          onError={onError}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        >
          <WalletModalProvider>
            <WalletConnectHandler>
              {children}
            </WalletConnectHandler>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </TransactionContext.Provider>
  );
};