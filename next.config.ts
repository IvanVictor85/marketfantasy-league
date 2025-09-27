import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Configuração estável
  reactStrictMode: false,
  swcMinify: false, // Desativando swcMinify para evitar problemas
  compress: true,
  
  // Otimizações de performance para Vercel
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
  
  // Configuração de output para Vercel
  output: 'standalone',
  
  // Desabilitar HMR completamente em desenvolvimento
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
    
    // Otimizações para produção
    if (!dev) {
      // Otimizações de bundle
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
      
      // Aliases para reduzir tamanho do bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, './'),
      };
    }
    
    return config;
  },
  
  // Configurações de imagem otimizadas
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
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
  
  // Configuração de env vars
  env: {
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  },
};

export default nextConfig;
