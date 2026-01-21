'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wallet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WalletConnectModal({ isOpen, onClose, onSuccess }: WalletConnectModalProps) {
  const { connectWalletToUser } = useAuth();
  const { connected, publicKey, disconnect } = useWallet();

  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [wasConnectedBefore, setWasConnectedBefore] = useState(false);

  // Declarar handleLinkWallet ANTES dos useEffects que o usam
  const handleLinkWallet = useCallback(async () => {
    if (!publicKey) {
      setError('Nenhuma carteira conectada');
      return;
    }

    setIsLinking(true);
    setError('');

    try {
      console.log('🔗 [MODAL] Vinculando carteira:', publicKey.toString());

      // Chamar API para vincular carteira
      const response = await fetch('/api/user/link-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ publicKey: publicKey.toString() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao vincular carteira');
      }

      console.log('✅ [MODAL] Carteira vinculada com sucesso');

      // Atualizar o contexto de autenticação
      await connectWalletToUser();

      setSuccess(true);
      toast.success('Carteira conectada com sucesso!');

      // Fechar o modal rapidamente após sucesso
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 500);

    } catch (err) {
      console.error('❌ [MODAL] Erro ao vincular carteira:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar carteira';

      // Se carteira já está vinculada, considerar como sucesso
      if (errorMessage.includes('já está vinculada') || errorMessage.includes('already linked')) {
        setSuccess(true);
        toast.success('Carteira já conectada!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 500);
        return;
      }

      setError(errorMessage);
      toast.error(errorMessage);

      // Desconectar a carteira se houver erro
      if (connected) {
        disconnect();
      }
    } finally {
      setIsLinking(false);
    }
  }, [publicKey, connectWalletToUser, onSuccess, onClose, connected, disconnect]);

  // Reset state quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setIsLinking(false);
      setError('');
      setSuccess(false);
      // Guardar se já estava conectado ao abrir o modal
      setWasConnectedBefore(connected);
    }
  }, [isOpen, connected]);

  // Quando a carteira conectar (transição de desconectado para conectado), vincular automaticamente
  useEffect(() => {
    // Só vincular se: modal aberto, carteira conectou agora (não estava conectada antes), não está vinculando, não teve sucesso ainda
    const justConnected = connected && publicKey && !wasConnectedBefore;

    if (justConnected && isOpen && !isLinking && !success) {
      console.log('🔗 [MODAL] Carteira detectada, iniciando vinculação automática...');
      handleLinkWallet();
    }

    // Atualizar o estado anterior
    if (connected) {
      setWasConnectedBefore(true);
    }
  }, [connected, publicKey, isOpen, wasConnectedBefore, isLinking, success, handleLinkWallet]);

  const handleClose = () => {
    if (!isLinking) {
      // Desconectar se não conseguiu vincular
      if (connected && !success) {
        disconnect();
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Conectar Carteira
          </DialogTitle>
          <DialogDescription>
            Conecte sua carteira Solana para criar times e participar de ligas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mensagem de erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Mensagem de sucesso */}
          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Sucesso!</AlertTitle>
              <AlertDescription className="text-green-600">
                Carteira conectada com sucesso. Redirecionando...
              </AlertDescription>
            </Alert>
          )}

          {/* Estado: Não conectado */}
          {!connected && !isLinking && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-muted rounded-lg">
                <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Clique no botão abaixo para conectar sua carteira Solana
                </p>
                <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-md !px-4 !py-2 !text-sm !font-medium !transition-colors !border-0 mx-auto" />
              </div>

              <div className="text-xs text-muted-foreground space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Você precisará de uma carteira Solana (como Phantom ou Solflare)
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  A carteira será vinculada à sua conta
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Você poderá criar times e participar de ligas
                </p>
              </div>
            </div>
          )}

          {/* Estado: Conectado, vinculando */}
          {connected && isLinking && (
            <div className="text-center p-6">
              <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-primary" />
              <p className="text-sm font-medium">Vinculando carteira...</p>
              <p className="text-xs text-muted-foreground mt-1">
                {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </p>
            </div>
          )}

          {/* Botão de cancelar */}
          {!success && !isLinking && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLinking}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
