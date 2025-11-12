export interface SendCodeResponse {
  message: string;
  email: string;
  expiresIn: number;
  developmentCode?: string;
  note?: string;
}

export interface User {
  id: string;
  email?: string;
  publicKey?: string;
  name?: string;
  username?: string;
  avatar?: string;
  loginMethod: 'email' | 'wallet';
  // Campos de perfil adicionais
  twitter?: string;
  discord?: string;
  bio?: string;
}

export interface AuthContextType {
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
  // Método para conectar carteira a usuário logado
  connectWalletToUser: () => Promise<void>;
  // Métodos para verificação de código
  sendVerificationCode: (email: string) => Promise<SendCodeResponse>;
  verifyCodeAndLogin: (email: string, code: string, name?: string) => Promise<void>;
}
