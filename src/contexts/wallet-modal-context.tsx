'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WalletModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  onSuccessCallback?: () => void;
  setOnSuccessCallback: (callback: () => void) => void;
}

const WalletModalContext = createContext<WalletModalContextType | undefined>(undefined);

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | undefined>();

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    setOnSuccessCallback(undefined);
  };

  const setCallback = (callback: () => void) => {
    setOnSuccessCallback(() => callback);
  };

  return (
    <WalletModalContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
        onSuccessCallback,
        setOnSuccessCallback: setCallback
      }}
    >
      {children}
    </WalletModalContext.Provider>
  );
}

export function useWalletModal() {
  const context = useContext(WalletModalContext);
  if (!context) {
    throw new Error('useWalletModal must be used within a WalletModalProvider');
  }
  return context;
}
