import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import '../globals.css';
import { WalletContextProvider } from '@/components/providers/wallet-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
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
  description: 'Fantasy sports meets market trading',
};

export default async function LayoutWithProviders({
  children,
  params
}: Readonly<{ 
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();
  
  return (
    <>
      <Script
        src="/suppress-metamask.js"
        id="suppress-metamask"
        strategy="beforeInteractive"
        data-nscript="beforeInteractive"
      />
      <ThemeProvider>
        <NextIntlClientProvider messages={messages}>
          <SessionProviderWrapper>
            <WalletContextProvider>
              <AuthProvider>
                <div className="min-h-screen bg-background">
                  {/* Navbar simplificado */}
                  <nav className="bg-primary sticky top-0 z-50 shadow-md">
                    <div className="container mx-auto px-4">
                      <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                          <span className="text-white font-bold text-xl">MFL</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <button className="text-white px-4 py-2 rounded">Login</button>
                        </div>
                      </div>
                    </div>
                  </nav>
                  
                  <main className="flex-1">
                    {children}
                  </main>
                  <ToasterClient />
                </div>
              </AuthProvider>
            </WalletContextProvider>
          </SessionProviderWrapper>
        </NextIntlClientProvider>
      </ThemeProvider>
    </>
  );
}
