'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Copy, ExternalLink, Zap } from 'lucide-react';
import { formatSolAmount } from '@/lib/solana/connection';
import { useEffect, useState } from 'react';
import { connection } from '@/lib/solana/connection';

export function WalletConnectButton() {
  const { publicKey, disconnect, connected, wallet } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (publicKey) {
      // Fetch wallet balance
      const fetchBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      };
      
      fetchBalance();
      
      // Set up interval to update balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [publicKey]);

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openInExplorer = () => {
    if (publicKey) {
      window.open(`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`, '_blank');
    }
  };

  if (connected && publicKey) {
    return (
      <Card className="w-fit">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {wallet?.adapter.icon && (
                <img 
                  src={wallet.adapter.icon} 
                  alt={wallet.adapter.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    {wallet?.adapter.name || 'Connected'}
                  </Badge>
                </div>
                {balance !== null && (
                  <span className="text-muted-foreground text-xs">
                    {formatSolAmount(balance)} SOL
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-8 w-8 p-0"
                title="Copy address"
              >
                <Copy className={`h-3 w-3 ${copied ? 'text-green-500' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={openInExplorer}
                className="h-8 w-8 p-0"
                title="View in explorer"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                title="Disconnect"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="wallet-adapter-button-trigger">
      <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-md !px-4 !py-2 !text-sm !font-medium !transition-colors !border-0" />
    </div>
  );
}

// Enhanced Phantom-focused wallet button
export function PhantomWalletButton() {
  const { select, wallets, publicKey, disconnect, connected, wallet } = useWallet();
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);

  useEffect(() => {
    // Check if Phantom is installed
    const checkPhantom = () => {
      const isInstalled = typeof window !== 'undefined' && 
        window.solana && 
        window.solana.isPhantom === true;
      setIsPhantomInstalled(!!isInstalled);
    };
    
    checkPhantom();
  }, []);

  const connectPhantom = () => {
    const phantom = wallets.find(wallet => wallet.adapter.name === 'Phantom');
    if (phantom) {
      select(phantom.adapter.name);
    } else {
      // Fallback to any available wallet
      if (wallets.length > 0) {
        select(wallets[0].adapter.name);
      }
    }
  };

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg">
          {wallet?.adapter.icon && (
            <img 
              src={wallet.adapter.icon} 
              alt={wallet.adapter.name}
              className="w-5 h-5 rounded-full"
            />
          )}
          <span className="font-medium text-sm">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!isPhantomInstalled) {
    return (
      <Button
        onClick={() => window.open('https://phantom.app/', '_blank')}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Zap className="h-4 w-4" />
        Install Phantom
      </Button>
    );
  }

  return (
    <Button
      onClick={connectPhantom}
      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
    >
      <Zap className="h-4 w-4" />
      Connect Phantom
    </Button>
  );
}

// Legacy custom wallet button for backward compatibility
export function CustomWalletButton() {
  const { select, wallets, publicKey, disconnect, connected } = useWallet();

  if (connected && publicKey) {
    return (
      <Button
        variant="outline"
        onClick={disconnect}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        <LogOut className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      onClick={() => {
        // Select first available wallet (Phantom preferred)
        const phantom = wallets.find(wallet => wallet.adapter.name === 'Phantom');
        if (phantom) {
          select(phantom.adapter.name);
        } else if (wallets.length > 0) {
          select(wallets[0].adapter.name);
        }
      }}
      className="flex items-center gap-2"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}