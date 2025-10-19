export interface VerificationCode {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

export interface AuthToken {
  userId: string;
  email: string;
  name: string;
  expiresAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  twitter?: string;
  discord?: string;
  bio?: string;
  createdAt: Date;
}

// Armazenamento global para evitar perda de dados entre requisições
declare global {
  var __verificationCodes: Map<string, VerificationCode> | undefined;
  var __authTokens: Map<string, AuthToken> | undefined;
  var __users: Map<string, User> | undefined;
}

// Simulação de armazenamento em memória (em produção, usar Redis ou banco de dados)
export const verificationCodes = globalThis.__verificationCodes ?? (globalThis.__verificationCodes = new Map<string, VerificationCode>());

// Simulação de armazenamento de tokens (em produção, usar JWT ou sessões)
export const authTokens = globalThis.__authTokens ?? (globalThis.__authTokens = new Map<string, AuthToken>());

// Simulação de banco de usuários (em produção, usar banco de dados)
export const users = globalThis.__users ?? (globalThis.__users = new Map<string, User>());

// Log para debug
console.log('🔧 [STORAGE] Inicializando armazenamento global:', {
  verificationCodesSize: verificationCodes.size,
  authTokensSize: authTokens.size,
  usersSize: users.size,
  isGlobal: !!globalThis.__verificationCodes
});

// Função para gerar código de 6 dígitos
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Função para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para gerar token de sessão
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Função para criar ou atualizar usuário
export function createOrUpdateUser(email: string): User {
  const existingUser = Array.from(users.values()).find(user => user.email === email);
  
  if (existingUser) {
    return existingUser;
  }
  
  const newUser: User = {
    id: Math.random().toString(36).substring(2),
    email,
    name: email.split('@')[0], // Nome padrão baseado no email
    createdAt: new Date()
  };
  
  users.set(newUser.id, newUser);
  return newUser;
}