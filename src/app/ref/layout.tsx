import type { Metadata } from 'next';
import { ThemeProvider } from '@/contexts/theme-context';
import '@/app/globals.css'; // ✅ Importar estilos globais

export const metadata: Metadata = {
  title: 'Convite | MFL - Crypto Fantasy League',
  description: 'Você foi convidado para o MFL - Crypto Fantasy League',
};

/**
 * Layout para páginas de referral
 * Inclui ThemeProvider para estilos funcionarem
 * Não renderiza html/body pois herda do root layout
 */
export default function RefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
