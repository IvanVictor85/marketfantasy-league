'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
// import { signIn, getSession } from 'next-auth/react'; // Temporariamente desabilitado
import { SendCodeResponse, User, AuthContextType } from '@/types/auth';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função para gerar ID determinístico baseado no email
function generateUserIdFromEmail(email: string): string {
  // Cria um hash simples do email para gerar um ID consistente
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `email_${Math.abs(hash)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey, connected, disconnect } = useWallet();

  const isAuthenticated = !!user;

  useEffect(() => {
    // Check for existing session on mount
    const checkExistingSession = () => {
      const savedUser = localStorage.getItem('mfl_user');
      console.log('DEBUG AuthProvider: Checking saved user:', savedUser);
      
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('DEBUG AuthProvider: Parsed user data:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          localStorage.removeItem('mfl_user');
        }
      } else {
        console.log('DEBUG AuthProvider: No saved user found');
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mfl_user');
    
    // If user was logged in with wallet, disconnect it
    if (user?.loginMethod === 'wallet' && connected) {
      disconnect();
    }
  }, [user?.loginMethod, connected, disconnect]);

  useEffect(() => {
    // Handle wallet connection changes
    if (connected && publicKey && user?.loginMethod === 'wallet') {
      setUser(prev => prev ? { ...prev, walletAddress: publicKey.toString() } : null);
    } else if (!connected && user?.loginMethod === 'wallet') {
      // If wallet disconnects, logout the user
      logout();
    }
  }, [connected, publicKey, user?.loginMethod, logout]);

  const sendVerificationCode = async (email: string): Promise<SendCodeResponse> => {
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
        throw new Error(result.error || 'Erro ao enviar código');
      }

      // Garantir que o resultado tenha todos os campos necessários
      const sendCodeResponse: SendCodeResponse = {
        message: result.message || 'Código enviado com sucesso',
        email: result.email || email,
        expiresIn: result.expiresIn || 300,
        developmentCode: result.developmentCode,
        note: result.note
      };

      return sendCodeResponse;
    } catch (error) {
      console.error('Send verification code error:', error);
      // Preservar a mensagem de erro original se for um Error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao enviar código de verificação.');
    }
  };

  const verifyCodeAndLogin = async (email: string, code: string, name?: string) => {
    setIsLoading(true);
    try {
      console.log('🔐 [VERIFY-CODE] Iniciando verificação:', { email, code, name });
      
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const result = await response.json();
      
      console.log('📡 [VERIFY-CODE] Resposta da API:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Código inválido');
      }

      // Usar o ID do usuário retornado pela API (que foi criado no banco)
      const userData: User = {
        id: result.user.id, // ID real do banco de dados
        email: result.user.email,
        name: result.user.name || name || email.split('@')[0],
        loginMethod: 'email',
        avatar: result.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        walletAddress: result.user.publicKey
      };

      console.log('✅ [VERIFY-CODE] Usuário criado/encontrado:', userData);

      setUser(userData);
      localStorage.setItem('mfl_user', JSON.stringify(userData));
      
      // Armazenar token de autenticação se fornecido
      if (result.token) {
        localStorage.setItem('auth-token', result.token);
        console.log('🔑 [VERIFY-CODE] Token armazenado');
      }
      
    } catch (error) {
      console.error('❌ [VERIFY-CODE] Erro:', error);
      throw new Error('Código inválido ou expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual email authentication
      // For now, simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData: User = {
        id: generateUserIdFromEmail(email),
        email,
        name: email.split('@')[0],
        loginMethod: 'email',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };

      setUser(userData);
      localStorage.setItem('mfl_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Email login error:', error);
      throw new Error('Falha no login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithWallet = async () => {
    if (!connected || !publicKey) {
      throw new Error('Carteira não conectada');
    }

    setIsLoading(true);
    try {
      console.log('🔗 [WALLET-LOGIN] Iniciando login com carteira:', publicKey.toString());
      
      // VALIDAR NO BACKEND se carteira já está em uso
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey.toString()
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          // Carteira em uso
          console.error('❌ [WALLET-LOGIN] Carteira já em uso:', result);
          throw new Error(result.error || 'Esta carteira já está conectada a outra conta');
        }
        throw new Error(result.error || 'Erro ao validar carteira');
      }
      
      console.log('✅ [WALLET-LOGIN] Carteira validada com sucesso');
      
      // Se a carteira já está conectada a um usuário, usar os dados dele
      if (result.user) {
        console.log('✅ [WALLET-LOGIN] Carteira já conectada, usando dados existentes');
        const userData: User = {
          id: result.user.id,
          email: result.user.email,
          walletAddress: result.user.publicKey,
          name: result.user.name || `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
          loginMethod: 'wallet',
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${publicKey.toString()}`
        };
        
        setUser(userData);
        localStorage.setItem('mfl_user', JSON.stringify(userData));
      } else {
        // Carteira nova - criar usuário temporário
        console.log('✅ [WALLET-LOGIN] Carteira nova, criando usuário temporário');
        const userData: User = {
          id: `wallet_${publicKey.toString()}`,
          walletAddress: publicKey.toString(),
          name: `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
          loginMethod: 'wallet',
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${publicKey.toString()}`
        };

        setUser(userData);
        localStorage.setItem('mfl_user', JSON.stringify(userData));
      }
      
      console.log('✅ [WALLET-LOGIN] Login concluído com sucesso');
    } catch (error) {
      console.error('❌ [WALLET-LOGIN] Erro:', error);
      throw new Error(error instanceof Error ? error.message : 'Falha no login com carteira');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // NextAuth temporariamente desabilitado
      throw new Error('Login com Google temporariamente desabilitado');
      
      // Usar NextAuth para login com Google
      // const result = await signIn('google', { 
      //   redirect: false,
      //   callbackUrl: '/dashboard'
      // });
      
      // if (result?.error) {
      //   throw new Error(result.error);
      // }
      
      // Se o login foi bem-sucedido, obter a sessão
      // const session = await getSession();
      
      // if (session?.user) {
      //   const userData: User = {
      //     id: `google_${session.user.email}`,
      //     email: session.user.email || '',
      //     name: session.user.name || '',
      //     avatar: session.user.image || '',
      //     loginMethod: 'email'
      //   };
      //   
      //   setUser(userData);
      //   localStorage.setItem('mfl_user', JSON.stringify(userData));
      // }
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error('Falha na autenticação com Google');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData: User = {
        id: generateUserIdFromEmail(email),
        email,
        name,
        loginMethod: 'email',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };

      setUser(userData);
      localStorage.setItem('mfl_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Falha no cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Conecta carteira a um usuário já logado por email
  const connectWalletToUser = async (publicKey: string) => {
    if (!user || !user.email) {
      throw new Error('Usuário não autenticado ou sem email');
    }

    try {
      console.log('🔗 [CONNECT-WALLET-USER] Conectando carteira ao usuário:', {
        userId: user.id,
        email: user.email,
        publicKey
      });

      // VALIDAR NO BACKEND se carteira já está em uso
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          publicKey: publicKey
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          // Carteira em uso
          console.error('❌ [CONNECT-WALLET-USER] Carteira já em uso:', result);
          throw new Error(result.error || 'Esta carteira já está conectada a outra conta');
        }
        throw new Error(result.error || 'Erro ao conectar carteira');
      }
      
      console.log('✅ [CONNECT-WALLET-USER] Carteira conectada com sucesso');
      
      // Atualizar usuário local com a carteira
      const updatedUser = { ...user, walletAddress: publicKey };
      setUser(updatedUser);
      localStorage.setItem('mfl_user', JSON.stringify(updatedUser));
      
      return result.user;
    } catch (error) {
      console.error('❌ [CONNECT-WALLET-USER] Erro:', error);
      throw error;
    }
  };

  // Atualiza perfil do usuário no banco E localmente
  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // 🔍 LOGS CRÍTICOS
      console.log('🔐 [AUTH] updateUserProfile chamado');
      console.log('🔐 [AUTH] User completo:', JSON.stringify(user, null, 2));
      console.log('🔐 [AUTH] user.id:', user.id);
      console.log('🔐 [AUTH] Tipo do user.id:', typeof user.id);
      console.log('🔐 [AUTH] Updates:', JSON.stringify(updates, null, 2));
      
      console.log('📝 [UPDATE-PROFILE] Atualizando perfil:', { userId: user.id, fields: Object.keys(updates) });

      const payload = {
        userId: user.id,
        name: updates.name,
        avatar: updates.avatar,
        twitter: updates.twitter,
        discord: updates.discord,
        bio: updates.bio
      };
      
      console.log('📡 [UPDATE-PROFILE] Payload enviado:', JSON.stringify(payload, null, 2));

      // 1. Salvar no banco via API
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      console.log('📡 [UPDATE-PROFILE] Status da resposta:', response.status);
      console.log('📡 [UPDATE-PROFILE] Resposta da API:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        console.error('❌ [UPDATE-PROFILE] Erro na API:', result);
        throw new Error(result.error || 'Erro ao atualizar perfil');
      }

      console.log('✅ [UPDATE-PROFILE] Perfil atualizado no banco');

      // 2. Atualizar estado local
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('mfl_user', JSON.stringify(updatedUser));

      console.log('✅ [UPDATE-PROFILE] Estado local atualizado');

      return true;
    } catch (error) {
      console.error('❌ [UPDATE-PROFILE] Erro:', error);
      throw error;
    }
  };





  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    loginWithEmail,
    loginWithWallet,
    loginWithGoogle,
    logout,
    register,
    updateUserProfile,
    connectWalletToUser,
    sendVerificationCode,
    verifyCodeAndLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}