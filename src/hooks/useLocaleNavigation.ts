'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Hook personalizado para navegação com locale
 * Facilita a criação de links que incluem automaticamente o locale atual
 */
export function useLocaleNavigation() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Cria um link com o locale atual
   * @param path - Caminho sem locale (ex: '/dashboard')
   * @returns Caminho com locale (ex: '/pt/dashboard')
   */
  const createLocalizedPath = (path: string): string => {
    // Remove barra inicial se existir para evitar dupla barra
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Se o path estiver vazio, retorna apenas o locale
    if (!cleanPath) {
      return `/${locale}`;
    }
    
    return `/${locale}/${cleanPath}`;
  };

  /**
   * Navega para um caminho com locale
   * @param path - Caminho sem locale
   * @param options - Opções de navegação do Next.js
   */
  const push = (path: string, options?: { scroll?: boolean }) => {
    const localizedPath = createLocalizedPath(path);
    router.push(localizedPath, options);
  };

  /**
   * Substitui a URL atual por um caminho com locale
   * @param path - Caminho sem locale
   * @param options - Opções de navegação do Next.js
   */
  const replace = (path: string, options?: { scroll?: boolean }) => {
    const localizedPath = createLocalizedPath(path);
    router.replace(localizedPath, options);
  };

  /**
   * Obtém o caminho atual sem o locale
   * @returns Caminho sem locale
   */
  const getCurrentPathWithoutLocale = (): string => {
    return pathname?.replace(/^\/(pt|en)/, '') || '/';
  };

  return {
    locale,
    createLocalizedPath,
    push,
    replace,
    getCurrentPathWithoutLocale,
    pathname,
  };
}