'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

/**
 * WalletSessionLinker - Componente que vincula automaticamente a carteira
 * conectada ao perfil do usuário quando ele conecta via Solana Wallet Adapter.
 *
 * FUNCIONAMENTO:
 * 1. Detecta quando carteira Solana é conectada
 * 2. Verifica se usuário está autenticado
 * 3. Verifica se a carteira conectada é diferente da salva no banco
 * 4. Vincula automaticamente via API
 * 5. Atualiza o contexto de autenticação
 *
 * Este componente deve ser renderizado uma vez no layout principal.
 */
export function WalletSessionLinker() {
  const { connected, publicKey } = useWallet();
  const { user, connectWalletToUser } = useAuth();

  // Ref para evitar chamadas duplicadas
  const isLinking = useRef(false);
  const lastLinkedWallet = useRef<string | null>(null);

  useEffect(() => {
    // 🔍 CONDIÇÕES PARA VINCULAR:
    // 1. Carteira está conectada
    // 2. PublicKey existe
    // 3. Usuário está autenticado
    // 4. Não está vinculando no momento
    const shouldLink =
      connected &&
      publicKey &&
      user &&
      !isLinking.current;

    if (!shouldLink) {
      return;
    }

    const currentWallet = publicKey.toString();
    const savedWallet = user.publicKey;

    // A carteira conectada é DIFERENTE da carteira salva no perfil?
    // (Isso inclui o caso de savedWallet ser null/undefined)
    const isWalletDifferent = savedWallet !== currentWallet;

    // Evitar vincular a mesma carteira múltiplas vezes
    const isAlreadyLinked = lastLinkedWallet.current === currentWallet;

    if (isWalletDifferent && !isAlreadyLinked) {
      isLinking.current = true; // Trava para evitar chamadas duplas

      console.log('🔗 [WALLET-LINKER] Detectada nova carteira, vinculando...', {
        currentWallet,
        savedWallet,
        user: user.email || user.name
      });

      const linkWallet = async () => {
        try {
          // Chamar API para vincular carteira
          const response = await fetch('/api/user/link-wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
            },
            body: JSON.stringify({ publicKey: currentWallet })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Erro ao vincular carteira');
          }

          console.log('✅ [WALLET-LINKER] Carteira vinculada com sucesso');

          // Atualizar o contexto de autenticação
          await connectWalletToUser(currentWallet);

          // Marcar como vinculada
          lastLinkedWallet.current = currentWallet;

          // Notificar o usuário
          toast.success('Carteira conectada e salva no seu perfil!', {
            description: `${currentWallet.slice(0, 8)}...${currentWallet.slice(-8)}`
          });

        } catch (error) {
          console.error('❌ [WALLET-LINKER] Erro ao vincular carteira:', error);

          const errorMessage = error instanceof Error ? error.message : 'Erro ao vincular carteira';

          // Notificar erro ao usuário
          toast.error('Erro ao salvar carteira', {
            description: errorMessage
          });

        } finally {
          isLinking.current = false; // Libera a trava
        }
      };

      linkWallet();
    }
  }, [connected, publicKey, user, connectWalletToUser]);

  // Este componente não renderiza nada visualmente
  return null;
}
