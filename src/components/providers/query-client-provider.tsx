'use client';

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Provider do React Query (@tanstack/react-query)
 * 
 * Gerencia o cache e refetch automático de dados da API.
 * 
 * Configurações padrão:
 * - staleTime: 4 minutos (dados considerados "frescos")
 * - cacheTime: 10 minutos (dados mantidos em cache)
 * - refetchOnWindowFocus: true (atualiza ao focar na janela)
 * - retry: 1 (tenta novamente 1 vez em caso de erro)
 */
export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  // ✅ Cria a instância do QueryClient apenas uma vez (usando useState)
  // Isso evita recriar o cliente a cada re-render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados são considerados "frescos" por 4 minutos
            staleTime: 4 * 60 * 1000, // 240000 ms
            // Dados são mantidos em cache por 10 minutos
            gcTime: 10 * 60 * 1000, // 600000 ms (anteriormente cacheTime)
            // Atualiza quando a janela ganha foco
            refetchOnWindowFocus: true,
            // Tenta novamente 1 vez em caso de erro
            retry: 1,
          },
        },
      })
  );

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  );
}

