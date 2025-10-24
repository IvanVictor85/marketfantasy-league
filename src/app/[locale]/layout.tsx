import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import '../globals.css';
import { WalletContextProvider } from '@/components/providers/wallet-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { NavbarFixed } from '@/components/layout/navbar-fixed';
import ToasterClient from '@/components/ui/toaster-client';
import { SessionProviderWrapper } from '@/components/providers/session-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Market Fantasy League (MFL)',
  description:
    'Fantasy sports meets market trading - Build your dream portfolio and compete with friends!',
  keywords: ['market', 'fantasy', 'blockchain', 'solana', 'trading', 'game', 'mfl'],
  authors: [{ name: 'Market Fantasy League Team' }],
  openGraph: {
    title: 'Market Fantasy League (MFL)',
    description: 'Fantasy sports meets market trading',
    type: 'website',
  },
};

export default async function LocaleLayout({
  children,
  params
}: Readonly<{ 
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const isProd = process.env.NODE_ENV === 'production';
  
  // Carregar mensagens para o locale atual
  const messages = await getMessages();
  
  return (
    <>
      {/* Temporarily disabled to fix React hydration issue */}
      {/* <Script
        src="/suppress-metamask.js"
        id="suppress-metamask"
        strategy="beforeInteractive"
        data-nscript="beforeInteractive"
      /> */}
      <ThemeProvider>
        <NextIntlClientProvider messages={messages}>
          <SessionProviderWrapper>
            <WalletContextProvider>
              <AuthProvider>
                <div className="min-h-screen bg-background">
                  <NavbarFixed />
                  <main className="flex-1">
                    {children}
                  </main>
                  <ToasterClient />
                  {/* Portal container for dropdowns */}
                  <div id="dropdown-portal" />
                </div>
              </AuthProvider>
            </WalletContextProvider>
          </SessionProviderWrapper>
        </NextIntlClientProvider>
      </ThemeProvider>
    </>
  );
}
