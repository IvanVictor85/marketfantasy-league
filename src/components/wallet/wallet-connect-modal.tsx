'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import {
  Wallet,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Shield,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ────────────────────────────────────────────────────────────── */

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/* ─── Constants ────────────────────────────────────────────────────────── */

/** Carteiras destacadas como "Top Choice" no grid principal */
const RECOMMENDED_WALLETS = new Set(['Phantom', 'Solflare', 'Mobile Wallet Adapter']);

/** Tamanho padronizado dos ícones (px) — garante uniformidade visual */
const ICON_SIZE_RECOMMENDED = 40; // w-10 h-10
const ICON_SIZE_OTHER = 28;       // w-7 h-7

/** Detecta se está em dispositivo móvel */
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/* ─── Component ────────────────────────────────────────────────────────── */

export function WalletConnectModal({ isOpen, onClose, onSuccess }: WalletConnectModalProps) {
  const { connectWalletToUser, user, isLoading: authLoading } = useAuth();
  const { connected, publicKey, disconnect, wallets, select, connect, wallet } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  /* ── Refs ─────────────────────────────────────────────────────────── */
  const wasLoginModeRef = useRef(false);
  const hasTriggeredCloseRef = useRef(false);
  const pendingConnectRef = useRef<string | null>(null);

  /* ── State ────────────────────────────────────────────────────────── */
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [wasConnectedBefore, setWasConnectedBefore] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  /* ── Derived: carteiras instaladas separadas por prioridade ──────── */
  const { recommended, others } = useMemo(() => {
    const mobile = isMobile();

    // No mobile, incluir wallets "NotDetected" também (serão abertas via deep link)
    const available = wallets.filter((w) => {
      if (w.readyState === 'Installed' || w.readyState === 'Loadable') return true;
      // No mobile, mostrar Phantom/Solflare mesmo se "NotDetected"
      if (mobile && RECOMMENDED_WALLETS.has(w.adapter.name)) return true;
      return false;
    });

    return {
      recommended: available.filter((w) => RECOMMENDED_WALLETS.has(w.adapter.name)),
      others: available.filter((w) => !RECOMMENDED_WALLETS.has(w.adapter.name)),
    };
  }, [wallets]);

  const allInstalled = useMemo(
    () => [...recommended, ...others],
    [recommended, others]
  );

  const isProcessing = isLinking || (connected && authLoading);

  /* ── Handlers ─────────────────────────────────────────────────────── */

  /** Seleciona uma carteira e conecta - SÍNCRONO para permitir popup */
  const handleSelectWallet = (walletName: string) => {
    console.log('🔌 [MODAL] Selecionando:', walletName);
    setConnectingWallet(walletName);
    setError('');

    const mobile = isMobile();

    // Encontrar o adaptador na lista
    const walletInfo = wallets.find(w => w.adapter.name === walletName);
    if (!walletInfo) {
      // No mobile, tentar abrir via deep link se não encontrar adaptador
      if (mobile && walletName === 'Phantom') {
        window.location.href = `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}`;
        return;
      }
      setError('Carteira não encontrada.');
      setConnectingWallet(null);
      return;
    }

    const adapter = walletInfo.adapter;
    console.log('🔌 [MODAL] Adaptador encontrado:', adapter.name, 'readyState:', adapter.readyState, 'mobile:', mobile);

    // Selecionar no contexto (para o useWallet ficar sincronizado)
    select(walletName as any);

    // Conectar diretamente no adaptador - SEM await antes para manter contexto do clique
    console.log('🔌 [MODAL] Conectando diretamente no adaptador...');
    adapter.connect()
      .then(() => {
        console.log('✅ [MODAL] Conexão bem-sucedida via adaptador!');
      })
      .catch((error: any) => {
        console.error('❌ [MODAL] Erro na conexão:', error?.name, error?.message);
        setConnectingWallet(null);

        if (error?.name === 'WalletWindowClosedError') {
          // Usuário fechou o popup - não mostrar erro
          return;
        }
        if (error?.name === 'WalletConnectionError' || error?.message?.includes('User rejected')) {
          setError('Conexão cancelada pelo usuário.');
          return;
        }
        // Erro de mobile wallet não encontrada - abrir app store ou deep link
        if (error?.message?.includes('mobile wallet protocol') || error?.name === 'WalletNotReadyError') {
          if (mobile && walletName === 'Phantom') {
            // Tentar abrir Phantom via deep link
            window.location.href = `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}`;
            return;
          }
          setError('Abra este site pelo app da carteira.');
          return;
        }
        setError('Falha ao conectar. Tente novamente.');
      });
  };

  /** Vincula a carteira conectada à conta do usuário (modo VINCULAR) */
  const handleLinkWallet = useCallback(async () => {
    if (!publicKey) {
      setError('Nenhuma carteira conectada');
      return;
    }

    setIsLinking(true);
    setError('');

    try {
      const response = await fetch('/api/user/link-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ publicKey: publicKey.toString() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao vincular carteira');

      await connectWalletToUser();
      setSuccess(true);
      toast.success('Carteira conectada com sucesso!');

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar carteira';
      setError(errorMessage);

      if (errorMessage.includes('já está vinculada')) {
        toast.error('Carteira já em uso em outra conta', {
          description: 'Use uma carteira diferente ou faça login com a conta que possui essa carteira.',
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }

      if (connected) disconnect();
    } finally {
      setIsLinking(false);
    }
  }, [publicKey, connectWalletToUser, onSuccess, onClose, connected, disconnect]);

  const handleClose = () => {
    if (!isLinking && !authLoading) {
      if (connected && !success && !user) disconnect();
      onClose();
    }
  };

  /* ── Effects ──────────────────────────────────────────────────────── */

  // Quando o wallet-adapter confirma a seleção → connect()
  useEffect(() => {
    console.log('🔍 [MODAL] useEffect wallet check:', {
      hasWallet: !!wallet,
      walletName: wallet?.adapter?.name,
      pendingConnect: pendingConnectRef.current,
      match: wallet?.adapter?.name === pendingConnectRef.current,
      adapterConnected: wallet?.adapter?.connected
    });

    if (wallet && pendingConnectRef.current && wallet.adapter.name === pendingConnectRef.current) {
      console.log('🔌 [MODAL] Wallet pronta, chamando connect()...');
      const walletToConnect = pendingConnectRef.current;
      pendingConnectRef.current = null;

      // Usar o adapter diretamente para garantir que o popup abra
      const adapter = wallet.adapter;
      console.log('🔌 [MODAL] Adapter status:', adapter.readyState, 'connected:', adapter.connected);

      if (adapter.connected) {
        console.log('✅ [MODAL] Adapter já conectado!');
        setConnectingWallet(null);
        return;
      }

      connect()
        .then(() => {
          console.log('✅ [MODAL] Conexão bem-sucedida!');
        })
        .catch((e) => {
          console.error('❌ [MODAL] Erro no connect():', e.name, e.message);
          setConnectingWallet(null);
          if (e.name === 'WalletConnectionError') {
            setError('Conexão rejeitada ou falhou. Tente novamente.');
          } else if (e.name !== 'WalletWindowClosedError') {
            setError('Falha ao conectar. Tente novamente.');
          }
        });
    }
  }, [wallet, connect]);

  // Reset ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setIsLinking(false);
      setError('');
      setSuccess(false);
      setConnectingWallet(null);
      pendingConnectRef.current = null;
      setWasConnectedBefore(connected);
      wasLoginModeRef.current = !user;
      hasTriggeredCloseRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Login bem-sucedido → fechar modal
  useEffect(() => {
    if (isOpen && wasLoginModeRef.current && user && !authLoading && !hasTriggeredCloseRef.current) {
      hasTriggeredCloseRef.current = true;
      setSuccess(true);
      setConnectingWallet(null);
      toast.success('Login realizado com sucesso!');

      const timer = setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, user, authLoading, onSuccess, onClose]);

  // Auto-vincular (modo VINCULAR, não LOGIN)
  useEffect(() => {
    const justConnected = connected && publicKey && !wasConnectedBefore;
    if (wasLoginModeRef.current) {
      if (justConnected) setWasConnectedBefore(true);
      return;
    }
    if (justConnected && isOpen && !isLinking && !success) {
      setWasConnectedBefore(true);
      handleLinkWallet();
    }
  }, [connected, publicKey, isOpen, wasConnectedBefore, isLinking, success, handleLinkWallet, authLoading]);

  // Desconexão inesperada
  useEffect(() => {
    if (wasConnectedBefore && !connected && !success && isOpen) {
      setError('Conexão cancelada');
      setWasConnectedBefore(false);
      setConnectingWallet(null);
    }
  }, [connected, wasConnectedBefore, success, isOpen]);

  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[92vw] sm:max-w-[460px] p-0 gap-0 border-0 bg-transparent overflow-hidden [&>button]:hidden"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Acessibilidade Radix — oculto visualmente */}
        <DialogHeader className="sr-only">
          <DialogTitle>Conectar Carteira</DialogTitle>
          <DialogDescription>Selecione uma carteira Solana para conectar</DialogDescription>
        </DialogHeader>

        {/* ── Ambient glow atrás do modal ─────────────────────────── */}
        <div className="absolute -inset-16 -z-10 pointer-events-none" aria-hidden>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-purple-600/[0.07] blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-green-500/[0.05] blur-[80px]" />
        </div>

        {/* ── Glassmorphism container ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl bg-gradient-to-b from-gray-900/95 to-gray-950/98
            backdrop-blur-xl border border-white/[0.08]
            shadow-[0_0_60px_-12px_rgba(139,92,246,0.15),0_0_30px_-8px_rgba(16,185,129,0.08)]
            overflow-hidden"
        >
          {/* Gradient glow — borda superior */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          {/* Background glow interno */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-purple-600/[0.08] rounded-full blur-3xl pointer-events-none" />

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="relative px-5 sm:px-6 pt-5 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Ícone header */}
                <div className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-green-500/20 border border-white/[0.06]">
                  <Wallet className="h-5 w-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                    {wasLoginModeRef.current ? 'Entrar com Carteira' : 'Conectar Carteira'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {wasLoginModeRef.current
                      ? 'Conecte para acessar o MFL'
                      : 'Vincule sua carteira Solana'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Solana Network Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-green-500/10 border border-purple-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">
                    Solana
                  </span>
                </div>

                {/* Botão fechar */}
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  aria-label="Fechar modal"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Divisor */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* ── Content ────────────────────────────────────────────── */}
          <div className="px-5 sm:px-6 py-5">
            <AnimatePresence mode="wait">
              {/* ── Estado: Erro ───────────────────────────────────── */}
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* ── Estado: Sucesso ────────────────────────────────── */}
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                  </motion.div>
                  <p className="text-white font-medium mt-4">
                    {wasLoginModeRef.current ? 'Login realizado com sucesso!' : 'Carteira conectada!'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Redirecionando...</p>
                </motion.div>
              )}

              {/* ── Estado: Processando (autenticando / vinculando) ─ */}
              {!success && isProcessing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <div className="relative w-16 h-16 mx-auto">
                    <div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-green-500/20 animate-spin"
                      style={{ animationDuration: '3s' }}
                    />
                    <div className="absolute inset-1 rounded-full bg-gray-900 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                    </div>
                  </div>
                  <p className="text-white font-medium mt-4">
                    {wasLoginModeRef.current ? 'Autenticando...' : 'Vinculando carteira...'}
                  </p>
                  <p className="text-slate-500 text-xs mt-2 font-mono">
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </p>
                  {wasLoginModeRef.current && (
                    <p className="text-slate-400 text-xs mt-3">Aprove a assinatura na sua carteira</p>
                  )}
                </motion.div>
              )}

              {/* ── Estado: Seleção de carteira ────────────────────── */}
              {!connected && !isLinking && !success && (
                <motion.div
                  key="wallets"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {allInstalled.length > 0 ? (
                    <div className="space-y-3">
                      {/* ── Carteiras Recomendadas — grid 2 colunas ── */}
                      {recommended.length > 0 && (
                        <div>
                          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-purple-400/70" />
                            Recomendadas
                          </p>
                          <div className="grid grid-cols-2 gap-2.5">
                            {recommended.map((w, i) => (
                              <motion.button
                                key={w.adapter.name}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06, duration: 0.25 }}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleSelectWallet(w.adapter.name)}
                                disabled={!!connectingWallet}
                                className="group relative flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-xl
                                  bg-white/[0.03] border border-white/[0.06]
                                  hover:border-purple-500/40
                                  hover:shadow-[0_0_20px_-4px_rgba(139,92,246,0.2),0_0_8px_-2px_rgba(16,185,129,0.1)]
                                  transition-[border-color,box-shadow] duration-300
                                  disabled:opacity-50 disabled:pointer-events-none"
                              >
                                {/* Fundo hover gradiente */}
                                <div
                                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                                    transition-opacity duration-300 pointer-events-none
                                    bg-gradient-to-b from-purple-500/[0.06] via-transparent to-green-500/[0.03]"
                                />

                                {/* Ícone — tamanho padronizado com container fixo */}
                                <div
                                  className="relative flex items-center justify-center shrink-0"
                                  style={{ width: ICON_SIZE_RECOMMENDED, height: ICON_SIZE_RECOMMENDED }}
                                >
                                  {connectingWallet === w.adapter.name ? (
                                    <Loader2 className="w-full h-full animate-spin text-purple-400" />
                                  ) : (
                                    <img
                                      src={w.adapter.icon}
                                      alt={w.adapter.name}
                                      className="w-full h-full rounded-xl object-contain"
                                    />
                                  )}
                                </div>

                                <div className="text-center relative">
                                  <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors duration-200">
                                    {w.adapter.name}
                                  </span>
                                  <span className="block text-[10px] text-purple-400/80 font-medium mt-0.5">
                                    Popular
                                  </span>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Outras Carteiras — grid 2 colunas ──────── */}
                      {others.length > 0 && (
                        <div>
                          {recommended.length > 0 && (
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2 mt-4">
                              Outras carteiras
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {others.map((w, i) => (
                              <motion.button
                                key={w.adapter.name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (recommended.length + i) * 0.05, duration: 0.2 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleSelectWallet(w.adapter.name)}
                                disabled={!!connectingWallet}
                                className="group flex items-center gap-3 p-3 rounded-xl
                                  bg-white/[0.02] border border-white/[0.05]
                                  hover:border-purple-500/30
                                  hover:shadow-[0_0_14px_-4px_rgba(139,92,246,0.15)]
                                  transition-[border-color,box-shadow] duration-200
                                  disabled:opacity-50 disabled:pointer-events-none"
                              >
                                {/* Ícone — container fixo para uniformidade */}
                                <div
                                  className="relative flex items-center justify-center shrink-0 rounded-lg bg-white/[0.04] p-1"
                                  style={{ width: ICON_SIZE_OTHER + 8, height: ICON_SIZE_OTHER + 8 }}
                                >
                                  {connectingWallet === w.adapter.name ? (
                                    <Loader2
                                      className="animate-spin text-purple-400"
                                      style={{ width: ICON_SIZE_OTHER, height: ICON_SIZE_OTHER }}
                                    />
                                  ) : (
                                    <img
                                      src={w.adapter.icon}
                                      alt={w.adapter.name}
                                      className="rounded-md object-contain"
                                      style={{ width: ICON_SIZE_OTHER, height: ICON_SIZE_OTHER }}
                                    />
                                  )}
                                </div>
                                <span className="text-sm text-slate-300 group-hover:text-white transition-colors duration-200 truncate">
                                  {w.adapter.name}
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── Nenhuma carteira instalada ─────────────────── */
                    <div className="text-center py-6">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/10 to-gray-800 border border-white/[0.06] flex items-center justify-center mb-4">
                        <Wallet className="h-7 w-7 text-slate-500" />
                      </div>
                      <p className="text-slate-300 font-medium mb-1">Nenhuma carteira detectada</p>
                      <p className="text-slate-400 text-sm mb-4">
                        Instale uma carteira Solana para continuar
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <a
                          href="https://phantom.app/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm hover:bg-purple-500/20 transition-colors duration-200"
                        >
                          Phantom <ExternalLink className="h-3 w-3" />
                        </a>
                        <a
                          href="https://solflare.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm hover:bg-orange-500/20 transition-colors duration-200"
                        >
                          Solflare <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer ─────────────────────────────────────────────── */}
          {!success && !isProcessing && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-white/50">
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] leading-tight">
                    Suas chaves privadas nunca são compartilhadas
                  </span>
                </div>
                <a
                  href="https://phantom.app/learn/crypto-101/what-is-a-crypto-wallet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-purple-400/80 hover:text-purple-300 transition-colors duration-200 flex items-center gap-1"
                >
                  O que é uma carteira?
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
