'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuthTranslations, useCommonTranslations, useValidationTranslations } from '@/hooks/useTranslations';

export default function VerifyCodePage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  const { verifyCodeAndLogin, sendVerificationCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const email = searchParams?.get('email') || '';
  const redirectTo = searchParams?.get('redirect') || `/${locale}/dashboard`;
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array(6).fill(null));

  // Traduções
  const tAuth = useAuthTranslations();
  const tCommon = useCommonTranslations();
  const tValidation = useValidationTranslations();

  // Timer para expiração do código
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Redirecionar se não tiver email
  useEffect(() => {
    if (!email) {
      router.push(`/${locale}/login`);
    }
  }, [email, router, locale]);

  // Focar no primeiro input quando o componente montar
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    let value = e.target.value;
    console.log(`🔍 handleCodeChange: index=${index}, value="${value}"`);
    
    // Permitir apenas um dígito
    if (value.length > 1) {
      // Se o usuário colou múltiplos dígitos, pegar apenas o primeiro
      value = value.charAt(0);
    }
    
    // Atualizar o código
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    console.log(`📝 Código atualizado:`, newCode);
    
    // Avançar para o próximo campo se um dígito foi inserido
    if (value && index < 5) {
      console.log(`➡️ Tentando focar no próximo campo: ${index + 1}`);
      // Mova o foco para o PRÓXIMO input
      inputRefs.current[index + 1]?.focus();
    }
    
    // Se o usuário apagou o campo, voltar para o anterior
    if (!value && index > 0) {
      console.log(`⬅️ Voltando para o campo anterior: ${index - 1}`);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Backspace: focar no input anterior se o atual estiver vazio
    if (e.key === 'Backspace' && e.currentTarget.value === '' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    
    // Arrow keys: navegar entre os campos
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
    
    // Enter: submeter o formulário se todos os campos estiverem preenchidos
    if (e.key === 'Enter') {
      e.preventDefault();
      const fullCode = code.join('');
      if (fullCode.length === 6) {
        handleSubmit(e as any);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i];
    }
    
    setCode(newCode);
    
    // Focar no próximo input vazio ou no último
    const nextEmptyIndex = newCode.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : Math.min(nextEmptyIndex, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError(tValidation('codeRequired'));
      return;
    }

    if (timeLeft <= 0) {
      setError('Código expirado. Solicite um novo código.');
      return;
    }

    if (attemptsLeft <= 0) {
      setError('Muitas tentativas. Solicite um novo código.');
      return;
    }

    setIsLoading(true);
    
    try {
      await verifyCodeAndLogin(email, fullCode, name || undefined);
      setSuccess('Login realizado com sucesso!');
      
      // Redirecionar após sucesso
      setTimeout(() => {
        router.push(redirectTo);
      }, 1500);
    } catch (error: any) {
      console.error('Erro na verificação:', error);
      setError(error.message || 'Código inválido');
      setAttemptsLeft(prev => prev - 1);
      
      // Limpar código em caso de erro
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');
    
    try {
      await sendVerificationCode(email);
      setSuccess('Novo código enviado!');
      setTimeLeft(300); // Reset timer
      setAttemptsLeft(3); // Reset attempts
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      setError(error.message || 'Erro ao reenviar código');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.push(`/${locale}/login`);
  };

  if (!email) {
    return null; // Ou um loading spinner
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{tAuth('verifyCode')}</CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos enviado para<br />
            <span className="font-medium text-gray-900">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                Nome (opcional)
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome para o time"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center"
              />
              <p className="text-xs text-gray-500 text-center">
                Este será o nome do seu time. Se deixar vazio, usaremos seu email.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-center block text-gray-700 dark:text-gray-300">Código de Verificação</Label>
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      if (el) inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    aria-label={`Dígito ${index + 1}`}
                    autoFocus={index === 0}
                    disabled={isLoading}
                    className="w-14 h-16 text-center text-2xl font-bold
                      border-2 border-gray-300 dark:border-gray-600
                      bg-white dark:bg-gray-800
                      text-gray-900 dark:text-white
                      rounded-lg
                      focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200
                      hover:border-gray-400 dark:hover:border-gray-500"
                  />
                ))}
              </div>
            </div>

            {/* Timer e tentativas */}
            <div className="text-center text-sm text-gray-600 space-y-1">
              <p>Tempo restante: <span className="font-mono font-bold">{formatTime(timeLeft)}</span></p>
              <p>Tentativas restantes: <span className="font-bold">{attemptsLeft}</span></p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || timeLeft <= 0 || attemptsLeft <= 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCommon('verifying')}
                  </>
                ) : (
                  tAuth('verify')
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendCode}
                disabled={isResending || timeLeft > 240} // Só permite reenviar após 1 minuto
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reenviar Código
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToLogin}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}