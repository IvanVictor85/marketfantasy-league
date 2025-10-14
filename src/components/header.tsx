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
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <LocalizedLink href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-foreground rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-sm">MFL</span>
              </div>
              <span className="font-bold text-lg hidden sm:block">Market Fantasy League</span>
            </LocalizedLink>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <LocalizedLink 
              href="/dashboard" 
              className="text-white hover:text-orange-100 transition-colors font-medium"
            >
              Dashboard
            </LocalizedLink>
            <LocalizedLink 
                href="/ligas" 
                className="text-white hover:text-orange-100 transition-colors font-medium"
              >
                Ligas
              </LocalizedLink>
            <LocalizedLink 
              href="/teams" 
              className="text-white hover:text-orange-100 transition-colors font-medium"
            >
              Escalação
            </LocalizedLink>
            <LocalizedLink 
              href="/market" 
              className="text-white hover:text-orange-100 transition-colors font-medium"
            >
              Mercado
            </LocalizedLink>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar..."
                className="pl-10 bg-background border-0 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Icon for Mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-orange-600"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative text-white hover:bg-orange-600"
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
              className="md:hidden text-white hover:bg-orange-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-orange-600 py-4">
            <nav className="flex flex-col space-y-3">
              <LocalizedLink 
                href="/dashboard" 
                className="text-white hover:text-orange-100 transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </LocalizedLink>
              <LocalizedLink 
                href="/leagues" 
                className="text-white hover:text-orange-100 transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Ligas
              </LocalizedLink>
              <LocalizedLink 
                href="/teams" 
                className="text-white hover:text-orange-100 transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Escalação
              </LocalizedLink>
              <LocalizedLink 
                href="/market" 
                className="text-white hover:text-orange-100 transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Mercado
              </LocalizedLink>
              {/* Mobile Search */}
              <div className="pt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar..."
                    className="pl-10 bg-background border-0 text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}