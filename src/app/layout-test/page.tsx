import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Market Fantasy League (MFL)',
  description: 'Fantasy sports meets market trading',
};

export default function LayoutTestPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar simples */}
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

      {/* Conteúdo principal */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-8">
            Market Fantasy League
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-8">
            Fantasy sports meets market trading - Build your dream portfolio and compete with friends!
          </p>
          <div className="text-center">
            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg mr-4">
              Começar a Jogar
            </button>
            <button className="border border-primary text-primary px-6 py-3 rounded-lg">
              Ver Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
