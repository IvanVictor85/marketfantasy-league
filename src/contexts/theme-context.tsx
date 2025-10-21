'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Carrega o tema do localStorage na inicialização
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    // SEMPRE usar light como padrão, ignorando preferência do sistema
    setTheme(savedTheme || 'light');
    setMounted(true);
  }, []);

  // Aplica o tema ao documento e salva no localStorage
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    // Remove classes de tema anteriores
    root.classList.remove('light', 'dark');
    
    // Adiciona a nova classe de tema
    root.classList.add(theme);
    
    // Salva no localStorage
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Evita flash de conteúdo não estilizado
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}