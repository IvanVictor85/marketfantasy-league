import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/providers/wallet-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CryptoFantasy League",
  description: "Fantasy sports meets cryptocurrency trading - Build your dream crypto portfolio and compete with friends!",
  keywords: ["crypto", "fantasy", "blockchain", "solana", "trading", "game"],
  authors: [{ name: "CryptoFantasy Team" }],
  openGraph: {
    title: "CryptoFantasy League",
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
        <script src="/suppress-metamask.js" async />
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
