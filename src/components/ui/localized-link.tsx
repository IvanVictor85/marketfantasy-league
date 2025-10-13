'use client';

import Link from 'next/link';
import { useLocaleNavigation } from '@/hooks/useLocaleNavigation';
import { ComponentProps, useState, useEffect } from 'react';

interface LocalizedLinkProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  href: string;
}

/**
 * Componente Link que inclui automaticamente o locale atual
 * Substitui o Link padrão do Next.js para navegação interna
 */
export function LocalizedLink({ href, children, ...props }: LocalizedLinkProps) {
  const { createLocalizedPath } = useLocaleNavigation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Durante a hidratação, usa um href padrão para evitar inconsistências
  if (!mounted) {
    return (
      <Link href={href.startsWith('http') ? href : `/pt${href}`} {...props}>
        {children}
      </Link>
    );
  }
  
  // Se o href já contém um locale ou é uma URL externa, usa como está
  if (href.startsWith('http') || href.match(/^\/(pt|en)\//)) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  
  // Cria o caminho localizado
  const localizedHref = createLocalizedPath(href);
  
  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  );
}