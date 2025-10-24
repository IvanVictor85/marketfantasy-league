import { useWallet } from '@solana/wallet-adapter-react';
import { useAppWalletStatus } from './useAppWalletStatus';
import { toast } from 'sonner';
import { Connection, Transaction, TransactionSignature, VersionedTransaction } from '@solana/web3.js';

/**
 * Hook de Ação Segura - A TRAVA DE SEGURANÇA CRÍTICA
 * 
 * Este hook substitui o useWallet em locais que disparam transações,
 * implementando uma trava de segurança que bloqueia ações quando há
 * incompatibilidade entre carteira do perfil e carteira conectada.
 */
export function useGuardedActionHook() {
  const wallet = useWallet();
  const { isMismatched, profileWallet, connectedWallet, mismatchDetails } = useAppWalletStatus();

  /**
   * Mostra alerta de incompatibilidade de carteira
   */
  const showMismatchAlert = () => {
    const profileShort = mismatchDetails?.profileWalletShort || 'N/A';
    const connectedShort = mismatchDetails?.connectedWalletShort || 'N/A';
    
    toast.error('Ação Bloqueada: Carteira Incompatível', {
      description: `Sua conta está vinculada à carteira ${profileShort}, mas você está conectado à ${connectedShort}. Por favor, troque de carteira na sua extensão para continuar.`,
      duration: 8000,
    });
  };

  /**
   * Verifica se a ação pode ser executada
   * @returns true se pode executar, false se bloqueado
   */
  const canExecuteAction = (): boolean => {
    if (isMismatched) {
      console.error('🚨 AÇÃO BLOQUEADA: Carteira incompatível detectada');
      showMismatchAlert();
      return false;
    }
    return true;
  };

  /**
   * Wrapper seguro para sendTransaction
   * Bloqueia a transação se houver incompatibilidade de carteira
   */
  const sendTransaction = async (
    transaction: Transaction,
    connection: Connection,
    options?: {
      skipPreflight?: boolean;
      preflightCommitment?: 'processed' | 'confirmed' | 'finalized';
      maxRetries?: number;
    }
  ): Promise<TransactionSignature> => {
    if (!canExecuteAction()) {
      throw new Error('Wallet mismatch: Cannot execute transaction with incompatible wallet');
    }

    if (!wallet.sendTransaction) {
      throw new Error('Wallet does not support sendTransaction');
    }

    return wallet.sendTransaction(transaction, connection, options);
  };

  /**
   * Wrapper seguro para signTransaction
   * Bloqueia a assinatura se houver incompatibilidade de carteira
   */
  const signTransaction = async <T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> => {
    if (!canExecuteAction()) {
      throw new Error('Wallet mismatch: Cannot sign transaction with incompatible wallet');
    }

    if (!wallet.signTransaction) {
      throw new Error('Wallet does not support signTransaction');
    }

    return wallet.signTransaction(transaction);
  };

  /**
   * Wrapper seguro para signAllTransactions
   * Bloqueia a assinatura se houver incompatibilidade de carteira
   */
  const signAllTransactions = async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
    if (!canExecuteAction()) {
      throw new Error('Wallet mismatch: Cannot sign transactions with incompatible wallet');
    }

    if (!wallet.signAllTransactions) {
      throw new Error('Wallet does not support signAllTransactions');
    }

    return wallet.signAllTransactions(transactions);
  };

  /**
   * Wrapper seguro para signMessage
   * Bloqueia a assinatura se houver incompatibilidade de carteira
   */
  const signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
    if (!canExecuteAction()) {
      throw new Error('Wallet mismatch: Cannot sign message with incompatible wallet');
    }

    if (!wallet.signMessage) {
      throw new Error('Wallet does not support signMessage');
    }

    return wallet.signMessage(message);
  };

  return {
    // Funções seguras (com trava de segurança)
    sendTransaction,
    signTransaction,
    signAllTransactions,
    signMessage,
    
    // Funções utilitárias
    canExecuteAction,
    showMismatchAlert,
    
    // Estado de segurança
    isMismatched,
    profileWallet,
    connectedWallet,
    mismatchDetails,
    
    // Propriedades originais do useWallet (sem modificação)
    publicKey: wallet.publicKey,
    connected: wallet.connected,
    connecting: wallet.connecting,
    disconnecting: wallet.disconnecting,
    wallet: wallet.wallet,
    wallets: wallet.wallets,
    select: wallet.select,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    autoConnect: wallet.autoConnect,
    signIn: wallet.signIn,
  };
}
