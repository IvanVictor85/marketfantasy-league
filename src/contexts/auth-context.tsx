'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  name?: string;
  avatar?: string;
  loginMethod: 'email' | 'wallet';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey, connected, disconnect } = useWallet();

  const isAuthenticated = !!user;

  useEffect(() => {
    // Check for existing session on mount
    const checkExistingSession = () => {
      const savedUser = localStorage.getItem('cryptofantasy_user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          localStorage.removeItem('cryptofantasy_user');
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('cryptofantasy_user');
    
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

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual email authentication
      // For now, simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData: User = {
        id: `email_${Date.now()}`,
        email,
        name: email.split('@')[0],
        loginMethod: 'email',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };

      setUser(userData);
      localStorage.setItem('cryptofantasy_user', JSON.stringify(userData));
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
      localStorage.setItem('cryptofantasy_user', JSON.stringify(userData));
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
      // Configuração do Google OAuth
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'demo-client-id';
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const scope = 'openid email profile';
      
      // URL de autorização do Google
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline`;
      
      // Abrir popup para autenticação
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      // Aguardar resposta do popup
      const result = await new Promise<any>((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            reject(new Error('Autenticação cancelada'));
          }
        }, 1000);
        
        // Simular resposta bem-sucedida para demonstração
        setTimeout(() => {
          popup?.close();
          clearInterval(checkClosed);
          resolve({
            email: 'usuario@gmail.com',
            name: 'Usuário Google',
            picture: 'https://via.placeholder.com/40'
          });
        }, 2000);
      });
      
      const userData: User = {
        id: `google_${Date.now()}`,
        email: result.email,
        name: result.name,
        avatar: result.picture,
        loginMethod: 'email'
      };
      
      setUser(userData);
      localStorage.setItem('cryptofantasy_user', JSON.stringify(userData));
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
        id: `email_${Date.now()}`,
        email,
        name,
        loginMethod: 'email',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };

      setUser(userData);
      localStorage.setItem('cryptofantasy_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Falha no cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
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
    register
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