'use client';

import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Wallet, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { VerifyCodeModal } from './verify-code-modal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { loginWithEmail, loginWithWallet, loginWithGoogle, register, isLoading: authLoading, sendVerificationCode } = useAuth();
  const { connected, publicKey } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [walletConnectionCancelled, setWalletConnectionCancelled] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowPassword(false);
    setWalletConnectionCancelled(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Detectar quando a conexão da carteira é cancelada
  useEffect(() => {
    // Se o modal está aberto e não há conexão, mas havia uma tentativa anterior
    if (isOpen && !connected && walletConnectionCancelled) {
      setError('');
      setWalletConnectionCancelled(false);
    }
  }, [connected, isOpen, walletConnectionCancelled]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validação mais detalhada
    if (!email) {
      setError('Por favor, insira seu email');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setError('Por favor, insira um email válido');
      return;
    }
    
    if (!password) {
      setError('Por favor, insira sua senha');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setIsLoading(true);
      await loginWithEmail(email, password);
      setSuccess('Login realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro no login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDebugCode(null);

    if (!email) {
      setError('Por favor, digite seu email');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Por favor, insira um email válido');
      return;
    }

    try {
      setIsLoading(true);
      const response = await sendVerificationCode(email);
      setVerificationEmail(email);
      setShowVerifyModal(true);

      // 🐛 DEBUG MODE: Se receber código de debug, exibir na tela
      if (response.developmentCode) {
        setDebugCode(response.developmentCode);
        setSuccess(`✅ Código enviado! ${response.note || ''}`);
        toast.success('Código enviado! Confira na tela abaixo 👇');
      } else {
        setSuccess('Código enviado para seu email!');
        toast.success('Código enviado para seu email!');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao enviar código. Tente novamente.');
      toast.error('Erro ao enviar código de verificação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validação mais detalhada
    if (!name) {
      setError('Por favor, insira seu nome');
      return;
    }
    
    if (name.length < 2) {
      setError('O nome deve ter pelo menos 2 caracteres');
      return;
    }
    
    if (!email) {
      setError('Por favor, insira seu email');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setError('Por favor, insira um email válido');
      return;
    }
    
    if (!password) {
      setError('Por favor, insira uma senha');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (!confirmPassword) {
      setError('Por favor, confirme sua senha');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      setIsLoading(true);
      await register(email, password, name);
      setSuccess('Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    
    try {
      setIsLoading(true);
      await loginWithGoogle();
      setSuccess('Login com Google realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro no login com Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setError('');
    
    if (!connected || !publicKey) {
      setError('Por favor, conecte sua carteira primeiro');
      setWalletConnectionCancelled(true);
      return;
    }

    try {
      await loginWithWallet();
      setSuccess('Login com carteira realizado com sucesso!');
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro no login com carteira';
      
      // Não mostrar erro se o usuário cancelou a conexão
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected the request')) {
        setWalletConnectionCancelled(true);
        return;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Bem-vindo ao Market Fantasy League
          </DialogTitle>
          <DialogDescription className="text-center">
            Faça login ou cadastre-se para começar a jogar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wallet Login Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5" />
                Login com Carteira Solana
              </CardTitle>
              <CardDescription>
                Conecte sua carteira para acesso rápido e seguro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <WalletMultiButton className="!w-full !bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !text-white !rounded-md !px-4 !py-2 !text-sm !font-medium !transition-colors !border-0" />
                
                {connected && publicKey && (
                  <Button
                    onClick={handleWalletLogin}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wallet className="w-4 h-4 mr-2" />
                    )}
                    Entrar com Carteira Conectada
                  </Button>
                )}

                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Entrar com Google
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou continue com email
              </span>
            </div>
          </div>

          {/* Email Login/Register Section */}
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Botão de login com design melhorado */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Entrar
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-[#2A9D8F] text-[#2A9D8F] hover:bg-[#2A9D8F] hover:text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={isLoading}
                    onClick={handleSendVerificationCode}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Entrar com código por email
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Ou continue com
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={isLoading}
                    onClick={handleGoogleLogin}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    Continuar com Google
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nome</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Cadastrar
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {walletConnectionCancelled && !error && (
            <Alert className="border-blue-200 bg-blue-50 text-blue-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Conexão da carteira cancelada. Clique no botão &quot;Connect Wallet&quot; acima para tentar novamente.
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* 🐛 DEBUG MODE: Exibir código quando disponível */}
          {debugCode && (
            <Alert className="border-orange-400 bg-orange-50 text-orange-900">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-bold">🐛 Modo Debug Ativado</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">Seu código de verificação:</p>
                  <div className="bg-white p-4 rounded-md border-2 border-orange-300">
                    <p className="text-3xl font-bold text-center tracking-widest text-orange-600">
                      {debugCode}
                    </p>
                  </div>
                  <p className="text-xs text-orange-700">
                    Este código também foi enviado para seu email. Copie e cole no modal de verificação.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <VerifyCodeModal
      isOpen={showVerifyModal}
      onClose={() => {
        setShowVerifyModal(false);
        setVerificationEmail('');
      }}
      email={verificationEmail}
      onVerificationSuccess={() => {
        setShowVerifyModal(false);
        onClose();
        resetForm();
        toast.success('Login realizado com sucesso!');
      }}
    />
  </>
  );
}