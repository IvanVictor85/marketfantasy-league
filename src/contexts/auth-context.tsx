'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { signIn, getSession } from 'next-auth/react';

interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  name?: string;
  avatar?: string;
  loginMethod: 'email' | 'wallet';
  // Campos de perfil adicionais
  twitter?: string;
  discord?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  // Novo método para atualizar o perfil do usuário
  updateUserProfile: (updates: Partial<User>) => void;
  // Métodos para verificação de código
  sendVerificationCode: (email: string) => Promise<{ message: string }>;
  verifyCodeAndLogin: (email: string, code: string, name?: string) => Promise<void>;
}

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

  const sendVerificationCode = async (email: string) => {
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

      return result;
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
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Código inválido');
      }

      const userData: User = {
        id: generateUserIdFromEmail(email),
        email,
        name: name || email.split('@')[0],
        loginMethod: 'email',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };

      setUser(userData);
      localStorage.setItem('mfl_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Verify code error:', error);
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
      // TODO: Implement wallet signature verification
      const userData: User = {
        id: `wallet_${publicKey.toString()}`,
        walletAddress: publicKey.toString(),
        name: `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
        loginMethod: 'wallet',
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${publicKey.toString()}`
      };

      setUser(userData);
      localStorage.setItem('mfl_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Wallet login error:', error);
      throw new Error('Falha no login com carteira');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Usar NextAuth para login com Google
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/dashboard'
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // Se o login foi bem-sucedido, obter a sessão
      const session = await getSession();
      
      if (session?.user) {
        const userData: User = {
          id: `google_${session.user.email}`,
          email: session.user.email || '',
          name: session.user.name || '',
          avatar: session.user.image || '',
          loginMethod: 'email'
        };
        
        setUser(userData);
        localStorage.setItem('mfl_user', JSON.stringify(userData));
      }
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

  // Atualiza perfil do usuário localmente
  const updateUserProfile = (updates: Partial<User>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('mfl_user', JSON.stringify(updatedUser));
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