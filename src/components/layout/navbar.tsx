'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LocalizedLink } from '@/components/ui/localized-link';
import { Menu, Trophy, Target, HelpCircle, Gift, Brain } from 'lucide-react';
import { useState } from 'react';
import { WalletConnectButton } from '@/components/layout/WalletConnectButton';
import { UserButton } from '@/components/auth/user-button';
import { LanguageSelector } from '@/components/ui/language-selector';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useNavigationTranslations } from '@/hooks/useTranslations';

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const tNav = useNavigationTranslations();

  const navigation = [
    { name: tNav('leagues'), href: '/ligas', icon: Trophy },
    { name: tNav('myTeam'), href: '/teams', icon: HelpCircle },
    { name: tNav('dashboard'), href: '/dashboard', icon: Target },
    { name: 'Análise IA', href: '/analise', icon: Brain },
    // { name: tNav('rewards'), href: '/rewards', icon: Gift }, // Temporariamente desabilitado
  ];

  return (
    <nav className="bg-primary sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <LocalizedLink href="/" prefetch={false} className="flex items-center">
            <Image 
              src="/icons/cfl-minimal-logo.png" 
              alt="CFL Logo" 
              width={40} 
              height={40}
              className="mr-3"
            />
            <span className="text-lg md:text-xl font-bold text-primary-foreground truncate">
              <span className="hidden sm:inline">Market Fantasy League</span>
              <span className="sm:hidden">MFL</span>
            </span>
          </LocalizedLink>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex md:items-center md:justify-center md:space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <LocalizedLink
                  key={item.name}
                  href={item.href}
                  prefetch={false}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-accent-foreground font-semibold'
                      : 'text-primary-foreground hover:text-accent-foreground'
                  }`}
                >
                  {item.name}
                </LocalizedLink>
              );
            })}
          </div>

          {/* User Authentication */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            <LanguageSelector />
            <ThemeToggle className="text-primary-foreground hover:text-accent-foreground" />
            <WalletConnectButton />
            <UserButton />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-card">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile User Authentication */}
                  <div className="pb-4 border-b space-y-3">
                    <LanguageSelector />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tema</span>
                      <ThemeToggle />
                    </div>
                    <WalletConnectButton />
                    <UserButton className="w-full" />
                  </div>

                  {/* Mobile Navigation */}
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <LocalizedLink
                        key={item.name}
                        href={item.href}
                        prefetch={false}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:text-primary hover:bg-primary/10'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </LocalizedLink>
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