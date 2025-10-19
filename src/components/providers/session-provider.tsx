'use client';

// import { SessionProvider } from 'next-auth/react'; // Temporariamente desabilitado
import { ReactNode } from 'react';

interface SessionProviderWrapperProps {
  children: ReactNode;
}

export function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  // NextAuth temporariamente desabilitado - retorna children diretamente
  return <>{children}</>;
}