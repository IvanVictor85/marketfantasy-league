// next.config.js
const path = require("path");
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração estável
  reactStrictMode: false,
  // swcMinify removido pois não é reconhecido na versão atual do Next.js
  compress: true,
  
  // Otimizações de performance para Vercel
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
  
  // Configuração de headers simplificada
  async headers() {
    return [
      {
        // Aplicar para todas as páginas
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Configuração de output para Vercel
  output: 'standalone',
  
  // Mantém a configuração padrão do webpack sem desabilitar HMR
  webpack: (config, { isServer }) => {
    // Suprimir warnings específicos do React sobre keys duplicadas (MetaMask)
    if (!isServer) {
      config.ignoreWarnings = [
        {
          module: /node_modules\/@solana\/wallet-adapter-react-ui/,
          message: /Encountered two children with the same key/,
        },
      ];
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
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cryptologos.cc',
        pathname: '/logos/**',
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

module.exports = withNextIntl(nextConfig);
