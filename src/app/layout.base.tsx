import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { WalletContextProvider } from "@/components/providers/wallet-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Market Fantasy League (MFL)",
  description: "Fantasy sports meets cryptocurrency trading - Build your dream crypto portfolio and compete with friends!",
  keywords: ["crypto", "fantasy", "blockchain", "solana", "trading", "game"],
  authors: [{ name: "Market Fantasy League Team" }],
  openGraph: {
    title: "Market Fantasy League (MFL)",
    description: "Fantasy sports meets cryptocurrency trading",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Script carregado no início para suprimir erros do MetaMask */}
        {/* 
          Usando o componente Script com a estratégia lazyOnload para evitar conflitos de hidratação
          com extensões do navegador como Magic Eden e MetaMask 
        */}
        <Script 
          src="/suppress-metamask.js"
          id="suppress-metamask"
          strategy="lazyOnload"
          data-nscript="lazyOnload"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <WalletContextProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
