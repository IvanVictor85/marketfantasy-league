import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import '../globals.css';
import { WalletContextProvider } from '@/components/providers/wallet-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { WalletModalProvider } from '@/contexts/wallet-modal-context';
import { NavbarFixed } from '@/components/layout/navbar-fixed';
import ToasterClient from '@/components/ui/toaster-client';
import { WalletConnectModalGlobal } from '@/components/wallet/wallet-connect-modal-global';
import { WalletSessionLinker } from '@/components/wallet/wallet-session-linker';
import { SessionProviderWrapper } from '@/components/providers/session-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { QueryClientProvider } from '@/components/providers/query-client-provider';

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
  let messages;
  try {
    // 🔧 CRÍTICO: Passar {locale} para carregar o arquivo correto (en.json ou pt.json)
    messages = await getMessages({ locale });
  } catch (error) {
    console.error('❌ [i18n] Erro ao carregar mensagens:', error);
    // Fallback para objeto vazio se houver erro
    messages = {};
  }

  return (
    <html lang={locale} className={inter.variable}>
      <body>
        {/* Temporarily disabled to fix React hydration issue */}
        {/* <Script
          src="/suppress-metamask.js"
          id="suppress-metamask"
          strategy="beforeInteractive"
          data-nscript="beforeInteractive"
        /> */}
        <ThemeProvider>
          {/* ✅ React Query Provider - Gerencia cache e refetch automático */}
          <QueryClientProvider>
            {/* ✅ CRÍTICO: NextIntlClientProvider DEVE receber locale e messages */}
            <NextIntlClientProvider locale={locale} messages={messages}>
              <SessionProviderWrapper>
                <WalletContextProvider>
                  <AuthProvider>
                    <WalletModalProvider>
                      <WalletSessionLinker />
                      <div className="min-h-screen bg-background">
                        <NavbarFixed />
                        <main className="flex-1">
                          {children}
                        </main>
                        <ToasterClient />
                        <WalletConnectModalGlobal />
                        {/* Portal container for dropdowns */}
                        <div id="dropdown-portal" />
                      </div>
                    </WalletModalProvider>
                  </AuthProvider>
                </WalletContextProvider>
              </SessionProviderWrapper>
            </NextIntlClientProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
