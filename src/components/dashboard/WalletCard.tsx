"use client";

import React, { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TREASURY_ADDRESS = '3GLFWDvTtxdmq6rSRFfeYExYVfpL5PTBR6LpfNq2eeFw';

export function WalletCard() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [balance, setBalance] = useState<string>('0.0000');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        if (!publicKey) {
          console.log('🔍 [BALANCE] Carteira não conectada');
          return;
        }

        console.log('🔍 [BALANCE] Buscando saldo para:', publicKey.toString());
        console.log('🔍 [BALANCE] RPC Endpoint:', connection.rpcEndpoint);

        const lamports = await connection.getBalance(publicKey);
        const sol = lamports / LAMPORTS_PER_SOL;

        console.log('✅ [BALANCE] Saldo obtido:', {
          lamports,
          sol: sol.toFixed(4)
        });

        setBalance(sol.toFixed(4));
      } catch (err) {
        console.error('❌ [BALANCE] Erro ao buscar saldo:', err);
        console.error('❌ [BALANCE] RPC Endpoint que falhou:', connection.rpcEndpoint);

        // Tentar usar API route como fallback
        try {
          // ✅ CORREÇÃO: Verificar novamente se publicKey existe antes de usar
          if (!publicKey) {
            console.log('❌ [BALANCE] PublicKey não disponível no fallback');
            return;
          }

          console.log('🔄 [BALANCE] Tentando API route como fallback...');
          const response = await fetch('/api/wallet/balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicKey: publicKey.toString() })
          });

          if (response.ok) {
            const data = await response.json();
            setBalance(data.balance);
            console.log('✅ [BALANCE] Saldo obtido via API:', data.balance);
          } else {
            toast.error('Erro ao buscar saldo. Verifique sua conexão.');
          }
        } catch (fallbackErr) {
          console.error('❌ [BALANCE] Fallback também falhou:', fallbackErr);
          toast.error('Erro ao conectar com a rede Solana');
        }
      }
    };
    fetchBalance();
  }, [publicKey, connection]);

  const handleDeposit = async () => {
    if (!publicKey) {
      toast.error('Conecte sua carteira para depositar.');
      return;
    }

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Informe um valor válido em SOL.');
      return;
    }

    const treasuryPublicKey = new PublicKey(TREASURY_ADDRESS);
    const lamports = Math.round(parsed * LAMPORTS_PER_SOL);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: treasuryPublicKey,
        lamports,
      })
    );

    await toast.promise(
      (async () => {
        // ✅ JÁ ESTÁ PROTEGIDO: publicKey foi verificado no início da função
        const signature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(signature, 'confirmed');
        
        // Atualiza saldo após confirmação
        const newLamports = await connection.getBalance(publicKey);
        setBalance((newLamports / LAMPORTS_PER_SOL).toFixed(4));
        setAmount('');
      })(),
      {
        loading: 'Processando depósito...',
        success: 'Depósito realizado com sucesso! ',
        error: 'Falha no depósito. Tente novamente.',
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minha Carteira</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">Saldo SOL: {balance}</p>
        <Input
          type="number"
          placeholder="Valor em SOL"
          value={amount}
          min={0}
          step={0.0001}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={handleDeposit}
        >
          Depositar SOL
        </Button>
      </CardContent>
    </Card>
  );
}