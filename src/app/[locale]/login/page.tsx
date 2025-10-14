'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowRight } from 'lucide-react';
import { useAuthTranslations, useCommonTranslations, useValidationTranslations } from '@/hooks/useTranslations';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { sendVerificationCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/dashboard';

  // Traduções
  const tAuth = useAuthTranslations();
  const tCommon = useCommonTranslations();
  const tValidation = useValidationTranslations();

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
      const result = await sendVerificationCode(email);
      setSuccess(result.message);
      
      // Redirecionar imediatamente para página de verificação
      const verifyUrl = `/verify-code?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`;
      router.push(verifyUrl);
    } catch (error: any) {
      console.error('Erro ao enviar código:', error);
      setError(error.message || 'Erro ao enviar código de verificação');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{tAuth('login')}</CardTitle>
          <CardDescription>
            Digite seu email para receber um código de verificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                <>
                  Enviar Código
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Não tem uma conta? Ela será criada automaticamente quando você fizer login.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}