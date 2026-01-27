'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
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
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // ✅ CORREÇÃO: Ref para prevenir múltiplas tentativas de login com a mesma carteira
  const loginAttemptRef = useRef<string | null>(null);

  // ✅ CORREÇÃO: Ref para prevenir múltiplas tentativas de VÍNCULO com a mesma carteira
  const linkAttemptRef = useRef<string | null>(null);

  // ✅ Flag para identificar se acabou de fazer login (para redirecionamento)
  const justLoggedInRef = useRef<boolean>(false);

  // ✅ Flag para identificar se é o carregamento inicial (evita logout no F5)
  const isInitialMountRef = useRef<boolean>(true);
  
  // Always call useWallet, but handle client-side logic inside
  const wallet = useWallet();
  const { publicKey, connected, disconnect, signMessage } = wallet;

  const isAuthenticated = !!user;

  // Detect client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (!isClient) return;

    // Check for existing session on mount
    const checkExistingSession = async () => {
      const savedUser = localStorage.getItem('mfl_user');
      const savedToken = localStorage.getItem('auth-token'); // ✅ Recuperar token também
      console.log('DEBUG AuthProvider: Checking saved user:', savedUser);
      console.log('DEBUG AuthProvider: Checking saved token:', savedToken ? 'EXISTS' : 'MISSING');

      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('DEBUG AuthProvider: Parsed user data:', userData);

          // ⚠️ Se usuário existe mas token não, limpar tudo e forçar novo login
          if (!savedToken) {
            console.log('⚠️ [AUTH] Usuário sem token válido. Limpando sessão...');
            localStorage.removeItem('mfl_user');
            localStorage.removeItem('auth-token');
            setUser(null);
            setIsLoading(false);
            return;
          }

          setUser(userData);

          // 🔄 Buscar dados atualizados do perfil do banco
          console.log('🔄 [AUTH] Sincronizando perfil do banco de dados...');
          try {
            const response = await fetch('/api/user/profile', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${savedToken}` // ✅ Sempre incluir token
              }
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                console.log('✅ [AUTH] Perfil atualizado do banco:', result.data);
                const updatedUser = { ...userData, ...result.data };
                setUser(updatedUser);
                localStorage.setItem('mfl_user', JSON.stringify(updatedUser));
              }
            } else if (response.status === 401) {
              // Token inválido ou expirado - limpar sessão
              console.log('⚠️ [AUTH] Token inválido ou expirado. Limpando sessão...');
              localStorage.removeItem('mfl_user');
              localStorage.removeItem('auth-token');
              setUser(null);
            } else {
              console.log('⚠️ [AUTH] Não foi possível buscar perfil atualizado');
            }
          } catch (error) {
            console.error('❌ [AUTH] Erro ao sincronizar perfil:', error);
          }
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          localStorage.removeItem('mfl_user');
          localStorage.removeItem('auth-token'); // ✅ Limpar token também
        }
      } else {
        console.log('DEBUG AuthProvider: No saved user found');
      }
      setIsLoading(false);

      // ✅ Marcar que o carregamento inicial terminou (após pequeno delay para wallet reconectar)
      setTimeout(() => {
        isInitialMountRef.current = false;
        console.log('✅ [AUTH] Carregamento inicial concluído, monitoramento de wallet ativo');
      }, 2000); // 2 segundos para dar tempo da wallet reconectar
    };

    checkExistingSession();
  }, [isClient]);

  // 🚀 useEffect para Redirecionamento Pós-Login e Onboarding
  useEffect(() => {
    // Só roda no cliente E se o usuário ESTIVER logado E não estiver carregando
    if (isClient && user && !isLoading) {

      // Define os caminhos de perfil (para evitar loop)
      const profilePathPt = '/pt/perfil';
      const profilePathEn = '/en/profile';

      // REGRA 1: ONBOARDING
      // Se o usuário logou com Carteira E o perfil está incompleto...
      if (user.loginMethod === 'wallet' && (!user.email || !user.username)) {
        // E ele NÃO está na página de perfil...
        if (pathname !== profilePathPt && pathname !== profilePathEn) {
          console.log('[AUTH] Perfil incompleto. Redirecionando para /perfil...');
          router.push(profilePathPt);
        }
        return; // Para aqui.
      }

      // REGRA 2: REDIRECIONAMENTO PÓS-LOGIN
      // Se o usuário está logado (e o perfil está completo)
      // E ele ainda está na Homepage...
      // MAS SÓ redireciona se acabou de fazer login (justLoggedInRef = true)
      const homePathPt = '/pt';
      const homePathEn = '/en';
      const loginPathPt = '/pt/login';
      const loginPathEn = '/en/login';

      // ✅ NÃO redirecionar se estiver na página de login - ela tem sua própria lógica
      const isOnLoginPage = pathname === loginPathPt || pathname === loginPathEn;
      const isOnHomePage = pathname === homePathPt || pathname === homePathEn || pathname === '/';

      console.log('[AUTH] Verificando redirecionamento pós-login:', { pathname, isOnLoginPage, isOnHomePage, justLoggedIn: justLoggedInRef.current });

      if (isOnHomePage && !isOnLoginPage && justLoggedInRef.current) {
        console.log('[AUTH] Usuário acabou de logar na home. Redirecionando para /dashboard...');
        // Redireciona para o dashboard no idioma correto
        const targetDashboard = pathname.startsWith('/en') ? '/en/dashboard' : '/pt/dashboard';
        router.push(targetDashboard);
        // Resetar a flag após redirecionar
        justLoggedInRef.current = false;
      }
    }
  }, [user, isClient, isLoading, router, pathname]);

  const logout = useCallback(() => {
    console.log('🚪 [LOGOUT] Iniciando logout:', {
      user: user?.email,
      loginMethod: user?.loginMethod,
      connected,
      publicKey: publicKey?.toString()
    });

    // ✅ Desconectar carteira APENAS se o login foi feito via wallet
    const shouldDisconnectWallet = user?.loginMethod === 'wallet' && connected;

    setUser(null);
    localStorage.removeItem('mfl_user');
    localStorage.removeItem('auth-token');

    // ✅ Resetar flag de login
    justLoggedInRef.current = false;

    // ✅ Desconectar carteira apenas se login foi via wallet
    if (shouldDisconnectWallet) {
      console.log('🔌 [LOGOUT] Desconectando carteira (login via wallet):', publicKey?.toString());
      disconnect();
    } else if (connected) {
      console.log('✅ [LOGOUT] Carteira mantida conectada (login via email)');
    }

    console.log('✅ [LOGOUT] Logout concluído');
  }, [user, connected, publicKey, disconnect]); // Manter user para garantir closure correta

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

      // ✅ CORREÇÃO: Usar spread operator para garantir que TODOS os campos sejam incluídos
      const userData: User = {
        ...result.user, // Pegar TODOS os campos do usuário do banco
        loginMethod: 'email',
        // Fallbacks apenas para campos que podem estar ausentes
        name: result.user.name || name || email.split('@')[0],
        avatar: result.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
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

      // ✅ Marcar que acabou de fazer login (para redirecionamento)
      justLoggedInRef.current = true;
    } catch (error) {
      console.error('Email login error:', error);
      throw new Error('Falha no login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithWallet = useCallback(async () => {
    // A verificação correta é se a função 'signMessage' existe
    if (!publicKey || !signMessage) {
      console.error('[SIWS] Erro: Carteira não conectada ou não suporta assinatura.');
      throw new Error('Carteira não conectada ou não suporta assinatura.');
    }

    setIsLoading(true);
    try {
      console.log('🔐 [SIWS] Iniciando Sign-In with Solana...');
      console.log('   Carteira:', publicKey.toString());

      // ==================================================
      // ETAPA 1: OBTER NONCE DO BACKEND
      // ==================================================
      console.log('📝 [SIWS] Etapa 1: Solicitando nonce...');
      
      const nonceResponse = await fetch('/api/auth/nonce');
      if (!nonceResponse.ok) {
        throw new Error('Falha ao obter nonce do servidor');
      }

      const { nonce } = await nonceResponse.json();
      console.log('✅ [SIWS] Nonce recebido:', nonce);

      // ==================================================
      // ETAPA 2: CRIAR MENSAGEM DE ASSINATURA
      // ==================================================
      const walletAddress = publicKey.toString();
      
      // CRÍTICO: Esta mensagem DEVE SER IDÊNTICA à do backend!
      const message = `Bem-vindo ao MFL!

Clique para assinar e provar que você é o dono desta carteira.

Isso não custará nenhum SOL.

ID de Desafio (Nonce): ${nonce}
Carteira: ${walletAddress}`;

      console.log('📜 [SIWS] Etapa 2: Mensagem criada');
      const encodedMessage = new TextEncoder().encode(message);

      // ==================================================
      // ETAPA 3: SOLICITAR ASSINATURA DO USUÁRIO
      // ==================================================
      console.log('✍️ [SIWS] Etapa 3: Solicitando assinatura da carteira...');
      
      // Double-check signMessage exists before calling
      if (!signMessage) {
        throw new Error('Carteira não suporta assinatura de mensagens');
      }

      const signature = await signMessage(encodedMessage);
      const signatureBase58 = bs58.encode(signature);
      
      console.log('✅ [SIWS] Assinatura obtida');

      // ==================================================
      // ETAPA 4: VERIFICAR ASSINATURA NO BACKEND
      // ==================================================
      console.log('🔐 [SIWS] Etapa 4: Verificando assinatura no servidor...');
      
      const verifyResponse = await fetch('/api/auth/verify-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nonce,
          signature: signatureBase58,
          publicKey: walletAddress
        })
      });

      const result = await verifyResponse.json();

      if (!verifyResponse.ok) {
        console.error('❌ [SIWS] Verificação falhou:', result);
        throw new Error(result.error || 'Falha na verificação da assinatura');
      }

      console.log('✅ [SIWS] Assinatura verificada com sucesso!');

      // ==================================================
      // ETAPA 5: AUTENTICAÇÃO CONCLUÍDA - ATUALIZAR ESTADO
      // ==================================================
      // ✅ CORREÇÃO: Usar spread operator para garantir que TODOS os campos sejam incluídos
      const userData: User = {
        ...result.user, // Pegar TODOS os campos do usuário do banco
        loginMethod: 'wallet',
        // Fallbacks apenas para campos que podem estar ausentes
        name: result.user.name || `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
        avatar: result.user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`
      };

      setUser(userData);
      localStorage.setItem('mfl_user', JSON.stringify(userData));

      // ✅ CORREÇÃO: Salvar token no localStorage para persistir sessão no F5
      if (result.token) {
        localStorage.setItem('auth-token', result.token);
        console.log('💾 [SIWS] Token salvo no localStorage');
      }

      // ✅ Marcar que acabou de fazer login (para redirecionamento)
      justLoggedInRef.current = true;

      console.log('✅ [SIWS] Login concluído com sucesso!');
      console.log('   Usuário:', userData.id);
      console.log('   Carteira verificada:', userData.publicKey);

    } catch (error) {
      console.error('❌ [SIWS] Erro no login:', error);
      
      // Mensagens de erro mais amigáveis
      let errorMessage = 'Falha no login com carteira';
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          errorMessage = 'Você cancelou a assinatura';
        } else if (error.message.includes('não suporta assinatura')) {
          errorMessage = 'Sua carteira não suporta assinatura de mensagens. Use Phantom ou Solflare.';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage]); // ✅ CORREÇÃO: Remover setIsLoading e setUser (são estáveis)

  // Conecta carteira a um usuário já logado por email
  // Conecta e VERIFICA (SIWS) uma carteira a um usuário já logado por email
  const connectWalletToUser = useCallback(async () => {
    if (!user || user.loginMethod !== 'email') {
      console.error('[SIWS-LINK] Usuário não está logado com email.');
      return;
    }
    if (!publicKey || !signMessage) {
      console.error('[SIWS-LINK] Carteira não conectada ou não suporta assinatura.');
      throw new Error('Carteira não conectada ou não suporta assinatura.');
    }

    console.log('🔗 [SIWS-LINK] Iniciando vínculo de carteira com conta de email...');
    setIsLoading(true);

    try {
      // ✅ NOVO: Verificar ANTES se a carteira já está em uso
      const walletAddress = publicKey.toString();
      console.log('🔍 [SIWS-LINK] Verificando disponibilidade da carteira...');
      
      const checkResponse = await fetch(`/api/wallet/check?publicKey=${walletAddress}`);
      const checkData = await checkResponse.json();

      if (!checkData.available) {
        console.error('❌ [SIWS-LINK] Carteira já em uso:', checkData);
        
        // Desconectar carteira
        if (connected && disconnect) {
          console.log('🔌 [SIWS-LINK] Desconectando carteira em uso...');
          disconnect();
        }

        throw new Error(
          `Esta carteira já está vinculada à conta "${checkData.accountName}". ` +
          `${checkData.accountHint ? `(${checkData.accountHint})` : ''}\n\n` +
          `Use uma carteira diferente ou faça login com a conta existente.`
        );
      }

      console.log('✅ [SIWS-LINK] Carteira disponível, prosseguindo com vinculação...');

      // Continuar com o fluxo normal...
      // 1. Obter o Nonce
      const nonceRes = await fetch('/api/auth/nonce');
      if (!nonceRes.ok) throw new Error('Falha ao buscar nonce');
      const { nonce } = await nonceRes.json();

      // 2. Criar a Mensagem
      const message = `Bem-vindo ao MFL!

Clique para assinar e provar que você é o dono desta carteira.

Isso não custará nenhum SOL.

ID de Desafio (Nonce): ${nonce}
Carteira: ${walletAddress}`;
      const encodedMessage = new TextEncoder().encode(message);

      // 3. Pedir Assinatura
      // Double-check signMessage exists before calling
      if (!signMessage) {
        throw new Error('Carteira não suporta assinatura de mensagens');
      }
      const signature = await signMessage(encodedMessage);
      const signatureBase58 = bs58.encode(signature);

      // 4. Verificar Assinatura E Vincular no Backend
      const verifyRes = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email, // Vincula ao email logado
          nonce,
          signature: signatureBase58,
          publicKey: walletAddress,
        }),
      });

      const result = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(result.error || 'Falha ao verificar e vincular carteira');
      }

      // 5. Sucesso! Atualizar o estado local
      console.log('✅ [SIWS-LINK] Carteira vinculada com sucesso!');
      const updatedUser = { ...user, publicKey: walletAddress };
      setUser(updatedUser);
      localStorage.setItem('mfl_user', JSON.stringify(updatedUser));

    } catch (error: any) {
      console.error('❌ [SIWS-LINK] Erro ao vincular carteira:', error.message);
      
      // ✅ CORREÇÃO: Desconectar carteira em casos de erro
      const shouldDisconnect = 
        error.message?.includes('rejected') || 
        error.message?.includes('cancelled') ||
        error.message?.includes('já está vinculada');

      if (shouldDisconnect && connected && disconnect) {
        console.log('🔌 [SIWS-LINK] Desconectando carteira...');
        disconnect();
      }
      
      throw new Error(error.message || 'Falha ao vincular carteira');
    } finally {
      setIsLoading(false);
    }
  }, [user, publicKey, signMessage, connected, disconnect]); // ✅ Adicionar disconnect às dependências

  // useEffect para gerenciar conexão/desconexão de carteira
  useEffect(() => {

    // REGRA 1: INICIAR LOGIN (O GATILHO QUE FALTAVA)
    // Se a carteira acabou de conectar (connected=true, publicKey existe)
    // E o usuário AINDA NÃO está logado (!user)
    // E não estamos no meio de um login (!isLoading)
    // E a carteira suporta assinatura (signMessage existe)
    if (isClient && connected && publicKey && signMessage && !user && !isLoading) {
      const walletAddress = publicKey.toString();

      // ✅ CORREÇÃO: Prevenir múltiplas tentativas de login com a mesma carteira
      if (loginAttemptRef.current === walletAddress) {
        console.log('⏭️ [AUTH] Já tentamos login com esta carteira, pulando...');
        return;
      }

      console.log('🔌 [AUTH] Carteira conectada, mas sem sessão. Iniciando fluxo SIWS...');
      loginAttemptRef.current = walletAddress;

      // Chama a função que tem as 5 etapas (a que já confirmamos que existe)
      loginWithWallet().catch((error) => {
        console.error('❌ [AUTH] Erro ao iniciar login automático:', error);
        // NÃO resetar loginAttemptRef aqui - queremos evitar loops mesmo em caso de erro
      });
    }

    // ✅ CORREÇÃO: Resetar refs quando usuário faz login com sucesso ou desconecta
    if (user && user.publicKey) {
      loginAttemptRef.current = null;
      linkAttemptRef.current = null; // Resetar também ref de vínculo quando vincular com sucesso
    }
    if (!connected) {
      loginAttemptRef.current = null;
      linkAttemptRef.current = null; // Resetar também ref de vínculo quando desconectar
    }

    // REGRA 2: FORÇAR LOGOUT POR DESCONEXÃO
    // Se a carteira foi desconectada (!connected)
    // E o usuário ESTAVA logado com carteira (user?.loginMethod === 'wallet')
    // ✅ CORREÇÃO: NÃO fazer logout durante carregamento inicial (evita logout no F5)
    if (isClient && !connected && user?.loginMethod === 'wallet' && !isInitialMountRef.current) {
      console.log('🔌 [AUTH] Carteira desconectada pelo usuário. Forçando logout.');
      logout();
    }

    // REGRA 3: INICIAR VÍNCULO (O GATILHO QUE FALTAVA)
    // Se o usuário está logado (com email) E conectou uma carteira
    // E a conta dele AINDA NÃO TEM uma carteira vinculada
    if (isClient && connected && publicKey && signMessage && user && user.loginMethod === 'email' && !user.publicKey && !isLoading) {
      const walletAddress = publicKey.toString();

      // ✅ CORREÇÃO: Prevenir múltiplas tentativas de vínculo com a mesma carteira
      if (linkAttemptRef.current === walletAddress) {
        console.log('⏭️ [AUTH] Já tentamos vincular esta carteira, pulando...');
        return;
      }

      console.log('🔗 [AUTH] Usuário de email conectou carteira. Iniciando fluxo de VÍNCULO (SIWS)...');
      linkAttemptRef.current = walletAddress;

      connectWalletToUser().catch((error) => {
        console.error('❌ [AUTH] Erro ao iniciar vínculo automático:', error);
        // ✅ IMPORTANTE: Em caso de erro (ex: usuário cancelou), resetar após delay
        // para permitir nova tentativa se o usuário quiser tentar novamente mais tarde
        setTimeout(() => {
          console.log('🔄 [AUTH] Resetando ref de vínculo após erro para permitir nova tentativa');
          linkAttemptRef.current = null;
        }, 5000); // 5 segundos de cooldown
      });
    }

    // A verificação de MISMATCH (troca de carteira) é feita
    // pelo 'useAppWalletStatus.ts', então não precisamos dela aqui.

  }, [isClient, connected, publicKey, signMessage, user, isLoading, loginWithWallet, logout, connectWalletToUser]);

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
        username: updates.username,
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