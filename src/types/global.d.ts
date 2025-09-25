// Global type declarations for Solana wallet integration

interface Window {
  solana?: {
    isPhantom?: boolean;
    connect?: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect?: () => Promise<void>;
    signTransaction?: (transaction: any) => Promise<any>;
    signAllTransactions?: (transactions: any[]) => Promise<any[]>;
    signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    on?: (event: string, callback: (...args: any[]) => void) => void;
    off?: (event: string, callback: (...args: any[]) => void) => void;
    request?: (args: { method: string; params?: any }) => Promise<any>;
    publicKey?: {
      toString: () => string;
    };
    isConnected?: boolean;
  };
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect?: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect?: () => Promise<void>;
      signTransaction?: (transaction: any) => Promise<any>;
      signAllTransactions?: (transactions: any[]) => Promise<any[]>;
      signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      off?: (event: string, callback: (...args: any[]) => void) => void;
      request?: (args: { method: string; params?: any }) => Promise<any>;
      publicKey?: {
        toString: () => string;
      };
      isConnected?: boolean;
    };
  }
}

export {};