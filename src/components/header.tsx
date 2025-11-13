'use client';

import { Search, Bell, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserButton } from '@/components/auth/user-button';
import { LocalizedLink } from '@/components/ui/localized-link';
import { useState } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-b from-[#f97316] to-[#f97316]/0 dark:from-[#000000] dark:to-[#000000]/0 text-white shadow-lg sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <LocalizedLink href="/" className="flex items-center space-x-2" prefetch={false}>
              <div className="w-8 h-8 bg-white dark:bg-[#16a34a] rounded-lg flex items-center justify-center shadow-md">
                <span className="text-[#f97316] dark:text-white font-bold text-sm">MFL</span>
              </div>
              <span className="font-bold text-lg hidden sm:block text-white">Market Fantasy League</span>
            </LocalizedLink>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <LocalizedLink 
              href="/dashboard" 
              className="text-white/90 hover:text-white transition-colors font-medium text-sm"
            >
              Dashboard
            </LocalizedLink>
            <LocalizedLink 
              href="/ranking" 
              className="text-white/90 hover:text-white transition-colors font-medium text-sm"
            >
              Ranking
            </LocalizedLink>
            <LocalizedLink 
                href="/ligas" 
                className="text-white/90 hover:text-white transition-colors font-medium text-sm"
              >
                Ligas
              </LocalizedLink>
            <LocalizedLink 
              href="/teams" 
              className="text-white/90 hover:text-white transition-colors font-medium text-sm"
            >
              Meu Time
            </LocalizedLink>
            <LocalizedLink 
              href="/market" 
              className="text-white/90 hover:text-white transition-colors font-medium text-sm"
            >
              Mercado
            </LocalizedLink>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative text-white/90 hover:text-white hover:bg-white/5"
            >
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full p-0 flex items-center justify-center">
                3
              </Badge>
            </Button>

            {/* User Profile */}
            <UserButton />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white/90 hover:text-white hover:bg-white/5"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <nav className="flex flex-col space-y-3">
              <LocalizedLink 
                href="/dashboard" 
                className="text-white/90 hover:text-white transition-colors font-medium py-2 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </LocalizedLink>
              <LocalizedLink 
                href="/ranking" 
                className="text-white/90 hover:text-white transition-colors font-medium py-2 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Ranking
              </LocalizedLink>
              <LocalizedLink 
                href="/ligas" 
                className="text-white/90 hover:text-white transition-colors font-medium py-2 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Ligas
              </LocalizedLink>
              <LocalizedLink 
                href="/teams" 
                className="text-white/90 hover:text-white transition-colors font-medium py-2 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Meu Time
              </LocalizedLink>
              <LocalizedLink 
                href="/market" 
                className="text-white/90 hover:text-white transition-colors font-medium py-2 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Mercado
              </LocalizedLink>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}