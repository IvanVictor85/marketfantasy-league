import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração estável
  reactStrictMode: false,
  
  // Desabilitar HMR completamente
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Remover plugins de HMR
      config.plugins = config.plugins.filter((plugin: any) => {
        return plugin.constructor.name !== 'HotModuleReplacementPlugin';
      });
      
      // Desabilitar watch
      config.watchOptions = {
        poll: false,
        ignored: ['**/node_modules/**', '**/.git/**'],
      };
      
      // Desabilitar HMR no entry
      if (!isServer && config.entry) {
        const originalEntry = config.entry;
        config.entry = async () => {
          const entries = await (typeof originalEntry === 'function' ? originalEntry() : originalEntry);
          
          // Filtrar entradas relacionadas ao HMR
          Object.keys(entries).forEach(key => {
            if (Array.isArray(entries[key])) {
              entries[key] = entries[key].filter((entry: string) => 
                !entry.includes('webpack/hot') && 
                !entry.includes('webpack-hot-middleware') &&
                !entry.includes('react-refresh')
              );
            }
          });
          
          return entries;
        };
      }
    }
    return config;
  },
  
  // Configurações de imagem
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        port: '',
        pathname: '/coins/images/**',
      },
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        port: '',
        pathname: '/coins/images/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
