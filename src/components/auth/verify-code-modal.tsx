"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, AlertCircle } from 'lucide-react';

interface VerifyCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerificationSuccess: (email: string) => void;
}

export function VerifyCodeModal({ 
  isOpen, 
  onClose, 
  email, 
  onVerificationSuccess 
}: VerifyCodeModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Timer para expiração do código
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError('');
      setSuccess('');
      setTimeLeft(300);
      setCanResend(false);
    }
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!code || code.length !== 6) {
      setError('Por favor, digite o código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro na verificação');
      }

      setSuccess('Código verificado com sucesso!');
      setTimeout(() => {
        onVerificationSuccess(email);
        onClose();
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na verificação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao reenviar código');
      }

      setSuccess('Novo código enviado!');
      setTimeLeft(300);
      setCanResend(false);
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reenviar código');
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">Verificar Código</DialogTitle>
          <DialogDescription className="text-center">
            Digite o código de 6 dígitos enviado para<br />
            <strong>{email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code" className="text-gray-700 dark:text-gray-300">
                Código de Verificação
              </Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                }}
                disabled={isLoading}
                autoFocus
                aria-label="Código de verificação de 6 dígitos"
                className="text-center text-2xl font-bold tracking-widest h-16
                  border-2 border-gray-300 dark:border-gray-600
                  bg-white dark:bg-gray-800
                  text-gray-900 dark:text-white
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  rounded-lg
                  focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  hover:border-gray-400 dark:hover:border-gray-500"
                maxLength={6}
              />
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {timeLeft > 0 ? (
                <span>Código expira em: <strong className="text-red-500">{formatTime(timeLeft)}</strong></span>
              ) : (
                <span className="text-red-500">Código expirado</span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Verificar Código
            </Button>
          </form>

          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              onClick={handleResendCode}
              disabled={!canResend || isResending}
              className="text-sm"
            >
              {isResending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {canResend ? 'Reenviar Código' : 'Reenviar Código'}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={handleClose}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-center text-muted-foreground">
            💡 Dica: Você pode colar o código completo de uma vez
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}