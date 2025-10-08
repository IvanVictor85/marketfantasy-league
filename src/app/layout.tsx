import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { WalletContextProvider } from '@/components/providers/wallet-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { Navbar } from '@/components/layout/navbar';
import ToasterClient from '@/components/ui/toaster-client';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CryptoFantasy League',
  description:
    'Fantasy sports meets cryptocurrency trading - Build your dream crypto portfolio and compete with friends!',
  keywords: ['crypto', 'fantasy', 'blockchain', 'solana', 'trading', 'game'],
  authors: [{ name: 'CryptoFantasy Team' }],
  openGraph: {
    title: 'CryptoFantasy League',
    description: 'Fantasy sports meets cryptocurrency trading',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isProd = process.env.NODE_ENV === 'production';
  return (
    <html lang="pt-BR">
      <head>
        {isProd && (
          <Script
            src="/suppress-metamask.js"
            id="suppress-metamask"
            strategy="lazyOnload"
            data-nscript="lazyOnload"
          />
        )}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <WalletContextProvider>
          <AuthProvider>
            <Navbar />
            <ToasterClient />
            {children}
          </AuthProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
