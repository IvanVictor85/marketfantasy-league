'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

/**
 * WalletSessionLinker - DESABILITADO
 *
 * MOTIVO DA DESABILITAÇÃO:
 * Este componente auto-vinculava qualquer carteira diferente ao perfil do usuário,
 * o que quebrava o sistema de segurança (useAppWalletStatus + useGuardedActionHook).
 *
 * PROBLEMA:
 * 1. Usuário loga com Wallet A
 * 2. Usuário troca para Wallet B no Phantom (acidentalmente ou maliciosamente)
 * 3. WalletSessionLinker detectava a diferença e auto-vinculava Wallet B
 * 4. Isso SOBRESCREVIA a wallet original, permitindo acesso não autorizado
 *
 * SISTEMA DE SEGURANÇA ATUAL:
 * - useAppWalletStatus detecta wallet mismatch
 * - useGuardedActionHook bloqueia todas as transações
 * - Usuário vê toast de erro e não pode fazer nada
 * - Usuário precisa trocar de volta para a carteira correta OU fazer logout manual
 *
 * A vinculação de carteira deve ser feita APENAS:
 * - No login inicial (via Phantom)
 * - Na página de perfil (via botão "Vincular Carteira" - ação manual do usuário)
 */
export function WalletSessionLinker() {
  // COMPONENTE DESABILITADO PARA PRESERVAR SEGURANÇA
  // Não faz nada, apenas retorna null
  return null;
}
