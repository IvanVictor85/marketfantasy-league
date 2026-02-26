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
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';
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
  const { setVisible, visible } = useWalletModal();

  // ✅ CRÍTICO: Fechar o modal do wallet-adapter quando a carteira conectar
  useEffect(() => {
    if (connected && publicKey && visible) {
      console.log('✅ [WALLET] Carteira conectada, fechando modal do wallet-adapter');
      setVisible(false);
    }
  }, [connected, publicKey, visible, setVisible]);

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
      // Mobile Wallet Adapter - para conexão em dispositivos móveis
      new SolanaMobileWalletAdapter({
        appIdentity: {
          name: 'Market Fantasy League',
          uri: typeof window !== 'undefined' ? window.location.origin : 'https://mfl.gg',
          icon: '/icons/LOGO_MFL.png',
        },
        addressSelector: {
          select: async (addresses) => addresses[0],
        },
        cluster: network,
        // Callback quando wallet não é encontrada - abre link para instalar
        onWalletNotFound: async () => {
          // Redireciona para página de download do Phantom
          if (typeof window !== 'undefined') {
            window.open('https://phantom.app/download', '_blank');
          }
        },
      }),
      // Desktop Wallets
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [network]
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
      // autoConnect pode gerar este erro quando a extensão não está pronta - ignorar silenciosamente
      console.log('⚠️ [WALLET] Erro genérico ignorado (provavelmente autoConnect):', error.name);
    } else {
      console.error('❌ Wallet error:', error.message, error);
    }
  }, [isTransactionActive]);

  return (
    <TransactionContext.Provider value={{ isTransactionActive, setTransactionActive }}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider
          wallets={wallets}
          autoConnect={false}
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