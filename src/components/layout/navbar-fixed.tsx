'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LocalizedLink } from '@/components/ui/localized-link';
import { Menu, Trophy, Target, Shirt, Brain } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSelector } from '@/components/ui/language-selector';
import { WalletConnectButton } from '@/components/layout/WalletConnectButton';
import { UserButton } from '@/components/auth/user-button';
import { useTranslations } from 'next-intl';

export function NavbarFixed() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('navigation');

  const navigation = [
    { name: t('leagues'), href: '/ligas', icon: Trophy },
    { name: t('myTeam'), href: '/teams', icon: Shirt },
    { name: t('dashboard'), href: '/dashboard', icon: Target },
    { name: 'Análise IA', href: '/analise', icon: Brain },
  ];

  return (
    <nav className="bg-primary sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.includes(item.href);
              
              return (
                <LocalizedLink
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </LocalizedLink>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />
            <ThemeToggle />
            <WalletConnectButton />
            <UserButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname?.includes(item.href);
                    
                    return (
                      <LocalizedLink
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </LocalizedLink>
                    );
                  })}
                  
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-center">
                      <LanguageSelector />
                    </div>
                    <div className="flex justify-center">
                      <ThemeToggle />
                    </div>
                    <WalletConnectButton className="w-full" />
                    <UserButton className="w-full" />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
