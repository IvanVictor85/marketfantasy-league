'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
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
  const { connectWalletToUser, user, isLoading: authLoading } = useAuth();
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  // Ref para rastrear se o modal foi aberto sem usuário (modo login)
  const wasLoginModeRef = useRef(false);
  // Ref para evitar múltiplas execuções do fechamento
  const hasTriggeredCloseRef = useRef(false);

  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [wasConnectedBefore, setWasConnectedBefore] = useState(false);

  // Handler para abrir o modal nativo do wallet-adapter
  const handleOpenWalletSelector = useCallback(() => {
    console.log('🔌 [MODAL] Abrindo seletor de carteiras nativo...');
    // Fechar nosso modal primeiro
    onClose();
    // Abrir o modal nativo do wallet-adapter (sem conflito de overlays)
    setTimeout(() => {
      setWalletModalVisible(true);
    }, 100);
  }, [onClose, setWalletModalVisible]);

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

  // Reset state quando o modal abre (NÃO quando connected muda!)
  useEffect(() => {
    if (isOpen) {
      setIsLinking(false);
      setError('');
      setSuccess(false);
      // Guardar se já estava conectado ao abrir o modal (captura valor atual de connected)
      setWasConnectedBefore(connected);
      // Guardar se está em modo login (sem usuário ao abrir)
      wasLoginModeRef.current = !user;
      // Resetar flag de fechamento
      hasTriggeredCloseRef.current = false;
      console.log('🔍 [MODAL] Abriu em modo:', user ? 'VINCULAR' : 'LOGIN');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Removido 'connected' e 'user' para não resetar quando muda

  // ✅ NOVO: Detectar quando login foi bem-sucedido (modo login) e fechar modal
  useEffect(() => {
    // Log detalhado para debug
    console.log('🔍 [MODAL] useEffect login check:', {
      isOpen,
      wasLoginMode: wasLoginModeRef.current,
      hasUser: !!user,
      userId: user?.id,
      authLoading,
      hasTriggeredClose: hasTriggeredCloseRef.current
    });

    // Se: modal aberto + estava em modo login + agora tem usuário logado + não está carregando
    // E ainda não disparamos o fechamento
    if (isOpen && wasLoginModeRef.current && user && !authLoading && !hasTriggeredCloseRef.current) {
      console.log('✅ [MODAL] Login detectado! Preparando fechamento...');
      hasTriggeredCloseRef.current = true;
      setSuccess(true);
      toast.success('Login realizado com sucesso!');

      // Fechar modal após breve delay para mostrar sucesso
      const closeTimer = setTimeout(() => {
        console.log('✅ [MODAL] Executando fechamento...');
        if (onSuccess) onSuccess();
        onClose();
      }, 500);

      return () => clearTimeout(closeTimer);
    }
  }, [isOpen, user, authLoading, onSuccess, onClose]);

  // Quando a carteira conectar (transição de desconectado para conectado), vincular automaticamente
  // MAS apenas se NÃO estiver em modo login (o auth-context cuida do login)
  useEffect(() => {
    // Só vincular se: modal aberto, carteira conectou agora (não estava conectada antes), não está vinculando, não teve sucesso ainda
    const justConnected = connected && publicKey && !wasConnectedBefore;

    console.log('🔍 [MODAL] Estado:', {
      connected,
      publicKey: publicKey?.toString()?.slice(0, 8),
      wasConnectedBefore,
      isLinking,
      success,
      justConnected,
      isOpen,
      isLoginMode: wasLoginModeRef.current,
      authLoading
    });

    // ✅ IMPORTANTE: Se está em modo login, NÃO chamar handleLinkWallet
    // O auth-context detecta a conexão e faz o login automaticamente via SIWS
    if (wasLoginModeRef.current) {
      console.log('🔍 [MODAL] Modo LOGIN - auth-context cuida da autenticação');
      if (justConnected) {
        setWasConnectedBefore(true); // Marcar para não repetir
      }
      return;
    }

    // Modo VINCULAR: chamar handleLinkWallet
    if (justConnected && isOpen && !isLinking && !success) {
      console.log('🔗 [MODAL] Modo VINCULAR - iniciando vinculação automática...');
      setWasConnectedBefore(true);
      handleLinkWallet();
    }
  }, [connected, publicKey, isOpen, wasConnectedBefore, isLinking, success, handleLinkWallet, authLoading]);

  // ✅ NOVO: Detectar quando carteira desconecta após estar conectada (usuário cancelou)
  useEffect(() => {
    // Se estava conectado e agora desconectou, e não teve sucesso ainda
    if (wasConnectedBefore && !connected && !success && isOpen) {
      console.log('⚠️ [MODAL] Carteira desconectada - provável cancelamento');
      setError('Você cancelou a conexão da carteira');
      setWasConnectedBefore(false);
    }
  }, [connected, wasConnectedBefore, success, isOpen]);

  const handleClose = () => {
    if (!isLinking && !authLoading) {
      // Desconectar se não conseguiu vincular/logar
      if (connected && !success && !user) {
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
            {wasLoginModeRef.current ? 'Entrar com Carteira' : 'Conectar Carteira'}
          </DialogTitle>
          <DialogDescription>
            {wasLoginModeRef.current
              ? 'Conecte sua carteira Solana para entrar no MFL'
              : 'Conecte sua carteira Solana para criar times e participar de ligas'
            }
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
                {wasLoginModeRef.current
                  ? 'Login realizado com sucesso! Redirecionando...'
                  : 'Carteira conectada com sucesso. Redirecionando...'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Estado: Não conectado - Mostrar botão de carteira */}
          {/* Removido !authLoading para permitir conexão durante carregamento inicial da sessão */}
          {!connected && !isLinking && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-muted rounded-lg">
                <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Clique no botão abaixo para conectar sua carteira Solana
                </p>
                {/* Usar botão customizado que abre o seletor nativo sem conflito de modais */}
                <Button
                  onClick={handleOpenWalletSelector}
                  className="bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-90 text-white font-medium px-6 py-2"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Selecionar Carteira
                </Button>
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

          {/* Estado: Conectado, vinculando/autenticando */}
          {connected && (isLinking || authLoading) && (
            <div className="text-center p-6">
              <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-primary" />
              <p className="text-sm font-medium">
                {wasLoginModeRef.current ? 'Autenticando...' : 'Vinculando carteira...'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </p>
              {wasLoginModeRef.current && (
                <p className="text-xs text-muted-foreground mt-2">
                  Aprove a assinatura na sua carteira
                </p>
              )}
            </div>
          )}

          {/* Botão de cancelar */}
          {/* Mostrar quando: não teve sucesso, não está vinculando, e não está autenticando após conexão */}
          {!success && !isLinking && !(connected && authLoading) && (
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
