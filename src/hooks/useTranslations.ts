import { useTranslations as useNextIntlTranslations } from 'next-intl';

// Hook personalizado para traduções
export function useTranslations(namespace?: string) {
  const t = useNextIntlTranslations(namespace);
  
  return {
    t,
    // Funções auxiliares para namespaces específicos
    common: useNextIntlTranslations('common'),
    navigation: useNextIntlTranslations('navigation'),
    auth: useNextIntlTranslations('auth'),
    teams: useNextIntlTranslations('teams'),
    market: useNextIntlTranslations('market'),
    leagues: useNextIntlTranslations('leagues'),
    dashboard: useNextIntlTranslations('dashboard'),
    rewards: useNextIntlTranslations('rewards'),
    profile: useNextIntlTranslations('profile'),
    errors: useNextIntlTranslations('errors'),
    validation: useNextIntlTranslations('validation'),
  };
}

// Hook específico para traduções comuns
export function useCommonTranslations() {
  return useNextIntlTranslations('common');
}

// Hook específico para navegação
export function useNavigationTranslations() {
  return useNextIntlTranslations('navigation');
}

// Hook específico para autenticação
export function useAuthTranslations() {
  return useNextIntlTranslations('auth');
}

// Hook específico para times
export function useTeamsTranslations() {
  return useNextIntlTranslations('teams');
}

// Hook específico para mercado
export function useMarketTranslations() {
  return useNextIntlTranslations('market');
}

// Hook específico para ligas
export function useLeaguesTranslations() {
  return useNextIntlTranslations('leagues');
}

// Hook específico para dashboard
export function useDashboardTranslations() {
  return useNextIntlTranslations('dashboard');
}

// Hook específico para recompensas
export function useRewardsTranslations() {
  return useNextIntlTranslations('rewards');
}

// Hook específico para perfil
export function useProfileTranslations() {
  return useNextIntlTranslations('profile');
}

// Hook específico para erros
export function useErrorTranslations() {
  return useNextIntlTranslations('errors');
}

// Hook específico para validação
export function useValidationTranslations() {
  return useNextIntlTranslations('validation');
}