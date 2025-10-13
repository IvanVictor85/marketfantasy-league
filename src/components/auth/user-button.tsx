'use client';

import React, { useState, useEffect } from 'react';
import { LocalizedLink } from '@/components/ui/localized-link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  LogOut, 
  Settings, 
  Wallet, 
  Mail,
  ChevronDown,
  Loader2,
  BarChart3
} from 'lucide-react';

interface UserButtonProps {
  className?: string;
}

export function UserButton({ className }: UserButtonProps) {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <Button variant="ghost" size="sm" className="text-white" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <LocalizedLink href="/login">
        <Button
          variant="outline"
          size="sm"
          className={`text-white border-white hover:bg-white hover:text-primary bg-orange-600 ${className || ''}`}
        >
          <User className="w-4 h-4 mr-2" />
          Entrar
        </Button>
      </LocalizedLink>
    );
  }

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = () => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email ? user.email[0].toUpperCase() : 'U';
  };

  const getDisplayName = () => {
    if (user.name) return user.name;
    if (user.email) return user.email.split('@')[0];
    if (user.walletAddress) {
      return `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}`;
    }
    return 'Usuário';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center gap-2 text-white hover:bg-orange-600 h-auto py-2 px-3 ${className || ''}`}
        >
          <Avatar className="w-6 h-6">
            <AvatarImage src={user.avatar} alt={getDisplayName()} />
            <AvatarFallback className="text-xs bg-orange-500 text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium leading-none">
              {getDisplayName()}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Badge 
                variant="secondary" 
                className="text-xs px-1 py-0 h-4 bg-orange-100 text-orange-800"
              >
                {user.loginMethod === 'email' ? (
                  <Mail className="w-2 h-2 mr-1" />
                ) : (
                  <Wallet className="w-2 h-2 mr-1" />
                )}
                {user.loginMethod === 'email' ? 'Email' : 'Carteira'}
              </Badge>
            </div>
          </div>
          
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email || user.walletAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <LocalizedLink href="/dashboard" className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </LocalizedLink>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <LocalizedLink href="/perfil" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </LocalizedLink>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        
        {user.loginMethod === 'wallet' && user.walletAddress && (
          <DropdownMenuItem>
            <Wallet className="mr-2 h-4 w-4" />
            <span>Carteira</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}