import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/auth-context';

export interface AppWalletStatus {
  profileWallet: string | null;      // Carteira do banco (ex: 'Wallet_A')
  connectedWallet: string | null;    // Carteira da extensão (ex: 'Wallet_B')
  isMismatched: boolean;           // O ponto principal! (true se A != B)
  isProfileLoading: boolean;       // true se a sessão do usuário ainda está carregando
  isWalletConnected: boolean;      // true se a extensão tem uma carteira conectada
  mismatchDetails?: {
    profileWalletShort: string;
    connectedWalletShort: string;
  };
}

/**
 * Hook central para gerenciar estado de compatibilidade entre carteira do perfil e carteira conectada
 * 
 * Este hook é o "cérebro" da lógica de segurança, comparando constantemente:
 * - Carteira salva no perfil do usuário (fonte confiável)
 * - Carteira conectada na extensão do navegador (pode ser diferente)
 */
export function useAppWalletStatus(): AppWalletStatus {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { publicKey, connected } = useWallet();
  
  const [status, setStatus] = useState<AppWalletStatus>({
    profileWallet: null,
    connectedWallet: null,
    isMismatched: false,
    isProfileLoading: isLoading,
    isWalletConnected: false,
  });

  useEffect(() => {
    // Obter carteira do perfil (fonte confiável)
    const profileWallet = isAuthenticated && user ? (user.publicKey ?? null) : null;
    
    // Obter carteira conectada na extensão
    const connectedWallet = connected && publicKey ? publicKey.toString() : null;
    
    // 🔒 LÓGICA DEFINITIVA DE MISMATCH - ESTADO ESTÁVEL:
    // isMismatched SÓ é true se:
    // 1. Perfil não está carregando (!isLoading)
    // 2. Usuário está autenticado (isAuthenticated)
    // 3. Ambas as carteiras existem (profileWallet && connectedWallet)
    // 4. São diferentes (profileWallet !== connectedWallet)
    const isMismatched = Boolean(
      !isLoading && // ✅ Perfil carregado
      isAuthenticated && // ✅ Usuário autenticado
      profileWallet && // ✅ Carteira do perfil existe
      connectedWallet && // ✅ Carteira conectada existe
      profileWallet !== connectedWallet // ✅ São diferentes
    );
    
    // Criar detalhes para exibição
    const mismatchDetails = isMismatched ? {
      profileWalletShort: profileWallet ? `${profileWallet.slice(0, 4)}...${profileWallet.slice(-4)}` : '',
      connectedWalletShort: connectedWallet ? `${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}` : '',
    } : undefined;

    // 📊 DEBUG LOGS - Valores em tempo real
    // console.log('🔍 [WALLET-STATUS] Debug:', {
    //   profileWallet,
    //   connectedWallet,
    //   isMismatched,
    //   isProfileLoading: isLoading,
    //   isAuthenticated,
    //   connected,
    //   user: user ? {
    //     id: user.id,
    //     email: user.email,
    //     publicKey: user.publicKey // Adicionando para debug
    //   } : null,
    //   // Detalhes da lógica
    //   logic: {
    //     notLoading: !isLoading,
    //     authenticated: isAuthenticated,
    //     hasProfileWallet: !!profileWallet,
    //     hasConnectedWallet: !!connectedWallet,
    //     walletsDifferent: profileWallet !== connectedWallet
    //   }
    // });

    setStatus({
      profileWallet,
      connectedWallet,
      isMismatched,
      isProfileLoading: isLoading,
      isWalletConnected: connected,
      mismatchDetails,
    });

    // Log específico para mismatch - APENAS quando detectado
    if (isMismatched) {
      console.warn('🚨 WALLET MISMATCH DETECTED:', {
        profile: profileWallet,
        connected: connectedWallet,
        isAuthenticated,
        isLoading
      });
    }
  }, [user?.publicKey, publicKey, connected, isAuthenticated, isLoading]);

  // 🔍 MODO DE DEPURAÇÃO - Log detalhado antes do return
  // console.log(
  //   '%c[useAppWalletStatus] ATUALIZOU:',
  //   'background: #222; color: #bada55',
  //   {
  //     profileWallet: status.profileWallet,
  //     connectedWallet: status.connectedWallet,
  //     isProfileLoading: status.isProfileLoading,
  //     isMismatched: status.isMismatched, // O valor calculado
  //   }
  // );

  return status;
}
