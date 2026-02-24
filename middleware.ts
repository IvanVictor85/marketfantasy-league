import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['pt', 'en'],

  // Used when no locale matches
  defaultLocale: 'pt',

  // Always use locale prefix
  localePrefix: 'always'
});

export default async function middleware(request: NextRequest) {
  // 1. Executar middleware de internacionalização
  const response = intlMiddleware(request);

  // 2. Adicionar Headers de Segurança (OWASP A05:2021)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 3. Content-Security-Policy (substitui o deprecated X-XSS-Protection)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://api.dicebear.com https://api.coingecko.com https://*.coingecko.com",
    "font-src 'self'",
    "connect-src 'self' https://*.helius-rpc.com https://api.coingecko.com https://api.llama.fi wss://*",
    "frame-ancestors 'none'",
  ].join('; ');
  // Report-Only: monitora violações sem bloquear (wallet extensions injetam scripts que CSP enforce quebraria)
  response.headers.set('Content-Security-Policy-Report-Only', csp);

  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(pt|en)/:path*']
};
