'use client';

import { useWalletModal } from '@/contexts/wallet-modal-context';
import { WalletConnectModal } from './wallet-connect-modal';

export function WalletConnectModalGlobal() {
  const { isOpen, closeModal, onSuccessCallback } = useWalletModal();

  return (
    <WalletConnectModal
      isOpen={isOpen}
      onClose={closeModal}
      onSuccess={onSuccessCallback}
    />
  );
}
