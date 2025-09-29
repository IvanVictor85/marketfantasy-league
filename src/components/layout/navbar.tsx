'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Trophy, Target, HelpCircle, Wallet } from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Ligas', href: '/ligas', icon: Trophy },
  { name: 'Meu Time', href: '/teams', icon: HelpCircle },
  { name: 'Dashboard', href: '/dashboard', icon: Target },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-primary sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary-foreground">CryptoFantasy League</span>
          </a>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex md:items-center md:justify-center md:space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-accent-foreground font-semibold'
                      : 'text-primary-foreground hover:text-accent-foreground'
                  }`}
                >
                  {item.name}
                </a>
              );
            })}
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:flex md:items-center">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-md">
              <Wallet className="mr-2 h-4 w-4" /> Conectar Carteira
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Wallet Connection */}
                  <div className="pb-4 border-b space-y-3">
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-md">
                      <Wallet className="mr-2 h-4 w-4" /> Conectar Carteira
                    </Button>
                  </div>

                  {/* Mobile Navigation */}
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:text-primary hover:bg-primary/10'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </a>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}