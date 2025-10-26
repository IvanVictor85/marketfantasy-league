'use client';

import { useAuth } from '@/contexts/auth-context';
import { useWalletModal } from '@/contexts/wallet-modal-context';
import { useCallback } from 'react';

/**
 * Hook para verificar se o usuário tem carteira conectada
 * e abrir o modal de conexão se não tiver.
 *
 * @returns Função que executa uma ação somente se o usuário tiver carteira
 *
 * @example
 * const requireWallet = useRequireWallet();
 *
 * const handleSaveTeam = requireWallet(() => {
 *   // Esta função só será executada se o usuário tiver carteira
 *   saveTeam();
 * });
 */
export function useRequireWallet() {
  const { user } = useAuth();
  const { openModal, setOnSuccessCallback } = useWalletModal();

  const requireWallet = useCallback((action: () => void | Promise<void>) => {
    return async () => {
      // Verificar se o usuário tem carteira
      if (!user?.publicKey) {
        console.log('⚠️ [REQUIRE-WALLET] Usuário sem carteira - abrindo modal');

        // Definir callback para executar após conectar carteira
        setOnSuccessCallback(() => {
          console.log('✅ [REQUIRE-WALLET] Carteira conectada - executando ação');
          action();
        });

        // Abrir modal de conexão
        openModal();
        return;
      }

      // Usuário tem carteira - executar ação diretamente
      console.log('✅ [REQUIRE-WALLET] Carteira já conectada - executando ação');
      await action();
    };
  }, [user?.publicKey, openModal, setOnSuccessCallback]);

  return requireWallet;
}

/**
 * Hook simples para verificar se o usuário tem carteira
 *
 * @returns true se o usuário tem carteira, false caso contrário
 */
export function useHasWallet(): boolean {
  const { user } = useAuth();
  return !!user?.publicKey;
}
