const fs = require('fs');
const path = require('path');

console.log('🔧 Implementando redirecionamento pós-login...\n');

const authContextPath = path.join(__dirname, '..', 'src/contexts/auth-context.tsx');
let content = fs.readFileSync(authContextPath, 'utf8');

// PASSO 1: Adicionar usePathname ao import do next/navigation
const oldImport = "import { useRouter } from 'next/navigation';";
const newImport = "import { useRouter, usePathname } from 'next/navigation';";

if (!content.includes('usePathname')) {
  content = content.replace(oldImport, newImport);
  console.log('✅ Import do usePathname adicionado');
}

// PASSO 2: Adicionar hook usePathname logo após useRouter
const afterRouterHook = `export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();`;

const withPathnameHook = `export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();`;

if (!content.includes('const pathname = usePathname();')) {
  content = content.replace(afterRouterHook, withPathnameHook);
  console.log('✅ Hook usePathname adicionado ao AuthProvider');
}

// PASSO 3: Remover lógica de onboarding duplicada do checkExistingSession
const onboardingInCheckSession = `
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

if (content.includes('ONBOARDING: Redirecionar usuários de carteira')) {
  content = content.replace(onboardingInCheckSession, '');
  console.log('✅ Lógica de onboarding removida de checkExistingSession (será movida para useEffect dedicado)');
}

// PASSO 4: Adicionar novo useEffect de redirecionamento após o useEffect existente
const afterFirstUseEffect = `  }, [isClient]);

  const logout = useCallback(() => {`;

const newUseEffect = `  }, [isClient]);

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
      const homePathPt = '/pt';
      const homePathEn = '/en';

      if (pathname === homePathPt || pathname === homePathEn || pathname === '/') {
        console.log('[AUTH] Usuário logado na home. Redirecionando para /dashboard...');
        // Redireciona para o dashboard no idioma correto
        const targetDashboard = pathname.startsWith('/en') ? '/en/dashboard' : '/pt/dashboard';
        router.push(targetDashboard);
      }
    }
  }, [user, isClient, isLoading, router, pathname]);

  const logout = useCallback(() => {`;

if (!content.includes('useEffect para Redirecionamento Pós-Login e Onboarding')) {
  content = content.replace(afterFirstUseEffect, newUseEffect);
  console.log('✅ useEffect de redirecionamento pós-login adicionado');
}

fs.writeFileSync(authContextPath, content, 'utf8');

console.log('\n✨ Redirecionamento pós-login implementado com sucesso!');
console.log('\n📋 Comportamento implementado:');
console.log('   REGRA 1 - ONBOARDING:');
console.log('   - Usuários com loginMethod: "wallet"');
console.log('   - Sem email OU sem username');
console.log('   - → Redirecionados para /perfil');
console.log('');
console.log('   REGRA 2 - PÓS-LOGIN:');
console.log('   - Usuário logado com perfil completo');
console.log('   - Na homepage (/, /pt, /en)');
console.log('   - → Redirecionado para /dashboard (idioma correto)');
