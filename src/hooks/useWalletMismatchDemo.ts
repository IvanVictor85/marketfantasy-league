import { useState, useEffect } from 'react';
import { useAppWalletStatus } from './useAppWalletStatus';

/**
 * Hook de Demonstração para Testar Wallet Mismatch
 * 
 * Este hook pode ser usado para simular cenários de incompatibilidade
 * e testar o sistema de segurança.
 */
export function useWalletMismatchDemo() {
  const walletStatus = useAppWalletStatus();
  const [demoMode, setDemoMode] = useState(false);

  // Simular incompatibilidade para demonstração
  const simulateMismatch = () => {
    setDemoMode(true);
    console.log('🧪 DEMO: Simulando incompatibilidade de carteira');
  };

  const resetDemo = () => {
    setDemoMode(false);
    console.log('🧪 DEMO: Resetando simulação');
  };

  // Log de status para debug
  useEffect(() => {
    if (demoMode) {
      console.log('🧪 DEMO MODE ACTIVE - Wallet Status:', {
        profileWallet: walletStatus.profileWallet,
        connectedWallet: walletStatus.connectedWallet,
        isMismatched: walletStatus.isMismatched,
        isProfileLoading: walletStatus.isProfileLoading,
        isWalletConnected: walletStatus.isWalletConnected,
      });
    }
  }, [walletStatus, demoMode]);

  return {
    ...walletStatus,
    demoMode,
    simulateMismatch,
    resetDemo,
  };
}
