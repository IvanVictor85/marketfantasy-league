'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/auth-context';
import { useWalletModal } from '@/contexts/wallet-modal-context';
import { SendCodeResponse } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowRight, Wallet } from 'lucide-react';
import { useAuthTranslations, useCommonTranslations, useValidationTranslations } from '@/hooks/useTranslations';
import Image from 'next/image';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devCode, setDevCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { sendVerificationCode, user } = useAuth();
  const { connected, publicKey } = useWallet();
  const { openModal, closeModal } = useWalletModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const redirectTo = searchParams?.get('redirect') || `/${locale}/dashboard`;

  // Traduções
  const tAuth = useAuthTranslations();
  const tCommon = useCommonTranslations();
  const tValidation = useValidationTranslations();

  // Redirecionar quando user é setado (via useEffect para evitar race condition)
  // NÃO chamar closeModal() aqui - o modal gerencia seu próprio fechamento
  useEffect(() => {
    if (user && !isRedirecting) {
      console.log('🔀 [LOGIN] Usuário detectado, redirecionando para:', redirectTo);
      setIsRedirecting(true);
      // Delay maior para o modal mostrar sucesso antes do redirect
      setTimeout(() => {
        router.push(redirectTo);
      }, 1000);
    }
  }, [user, redirectTo, router, isRedirecting]);

  // Se está redirecionando, mostrar loading
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handler para login com wallet
  const handleWalletLogin = () => {
    openModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError(tValidation('emailRequired'));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(tValidation('emailInvalid'));
      return;
    }

    setIsLoading(true);

    try {
      const result: SendCodeResponse = await sendVerificationCode(email);
      setSuccess(result.message);
      
      // Se estiver em modo desenvolvimento, mostrar o código
      if (result.developmentCode) {
        setDevCode(result.developmentCode);
        setShowCode(true);
        setSuccess(`${result.message} - Código gerado!`);
        // Não redirecionar automaticamente em modo desenvolvimento
        return;
      }

      // Aguardar um pequeno delay para garantir que a mensagem de sucesso seja exibida
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Redirecionar para página de verificação com locale
      const verifyUrl = `/${locale}/verify-code?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`;
      router.push(verifyUrl);
    } catch (error: any) {
      console.error('Erro ao enviar código:', error);
      setError(error.message || 'Erro ao enviar código de verificação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl dark:shadow-none dark:border dark:border-gray-700/50">
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <Image
              src="/icons/LOGO_MFL.png"
              alt="MFL"
              fill
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold">{tAuth('login')}</CardTitle>
          <CardDescription>
            Escolha como deseja entrar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Opção 1: Login com Wallet (Recomendado) */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-xl blur opacity-30" />
              <Button
                onClick={handleWalletLogin}
                className="relative w-full h-14 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-90 text-white font-bold text-base"
              >
                <Wallet className="mr-3 h-5 w-5" />
                Entrar com Wallet
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">Recomendado</span>
              </Button>
            </div>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Phantom, Solflare, Backpack e outras wallets Solana
            </p>
          </div>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                ou continue com email
              </span>
            </div>
          </div>

          {/* Opção 2: Login com Email */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            {showCode && devCode && (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30">
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <div className="text-center">
                    <p className="font-semibold mb-2">Código de Verificação (Dev)</p>
                    <div className="text-2xl font-mono font-bold text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                      {devCode}
                    </div>
                    <p className="text-sm mt-2 mb-4">Use este código na próxima página</p>
                    <Button
                      onClick={() => {
                        const verifyUrl = `/${locale}/verify-code?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`;
                        router.push(verifyUrl);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Continuar para Verificação
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              variant="outline"
              className="w-full h-12 border-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Código por Email
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
            <p>
              Não tem conta? Ela será criada automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}