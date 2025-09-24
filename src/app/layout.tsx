import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/providers/wallet-provider";
import { AuthProvider } from "@/contexts/auth-context";

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
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
        <WalletContextProvider>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
          </AuthProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
