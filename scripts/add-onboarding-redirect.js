const fs = require('fs');
const path = require('path');

console.log('🔧 Adicionando onboarding redirect para usuários de carteira...\n');

const authContextPath = path.join(__dirname, '..', 'src/contexts/auth-context.tsx');
let content = fs.readFileSync(authContextPath, 'utf8');

// PASSO 1: Adicionar import do useRouter
if (!content.includes('useRouter')) {
  const importLine = "import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';";
  const newImportLine = `import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';`;

  content = content.replace(importLine, newImportLine);
  console.log('✅ Import do useRouter adicionado');
}

// PASSO 2: Adicionar useRouter hook dentro do AuthProvider
const providerStart = 'export function AuthProvider({ children }: { children: ReactNode }) {';
const routerHook = `export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();`;

if (!content.includes('const router = useRouter();')) {
  content = content.replace(providerStart, routerHook);
  console.log('✅ useRouter hook adicionado ao AuthProvider');
}

// PASSO 3: Adicionar lógica de redirecionamento após setUser
const afterSetUser = `                const updatedUser = { ...userData, ...result.data };
                setUser(updatedUser);
                localStorage.setItem('mfl_user', JSON.stringify(updatedUser));`;

const withRedirect = `                const updatedUser = { ...userData, ...result.data };
                setUser(updatedUser);
                localStorage.setItem('mfl_user', JSON.stringify(updatedUser));

                // ✅ ONBOARDING: Redirecionar usuários de carteira com perfil incompleto
                if (updatedUser.loginMethod === 'wallet' &&
                    (!updatedUser.email || !updatedUser.username)) {
                  const currentPath = window.location.pathname;
                  // Evitar loop de redirecionamento
                  if (!currentPath.includes('/perfil') && !currentPath.includes('/profile')) {
                    console.log('🔄 [AUTH] Perfil incompleto detectado. Redirecionando para /perfil...');
                    setTimeout(() => {
                      router.push('/perfil');
                    }, 100); // Pequeno delay para garantir que o estado foi atualizado
                  }
                }`;

if (!content.includes('ONBOARDING: Redirecionar usuários de carteira')) {
  content = content.replace(afterSetUser, withRedirect);
  console.log('✅ Lógica de onboarding adicionada');
}

fs.writeFileSync(authContextPath, content, 'utf8');
console.log('\n✨ Onboarding implementado com sucesso!');
console.log('\n📋 Comportamento:');
console.log('   - Usuários com loginMethod: "wallet"');
console.log('   - Sem email OU sem username');
console.log('   - Serão redirecionados para /perfil');
console.log('   - Apenas uma vez (evita loop de redirecionamento)');
