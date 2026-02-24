/**
 * 🔒 Sistema de Rate Limiting para APIs
 *
 * Protege contra:
 * - Ataques de força bruta
 * - Spam de requisições
 * - Consumo excessivo de recursos
 *
 * Em produção, considere usar Redis para rate limiting distribuído
 */

import { NextRequest } from 'next/server';

interface RateLimitConfig {
  interval: number; // Janela de tempo em ms
  uniqueTokenPerInterval: number; // Máximo de requisições na janela
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Cache em memória (para desenvolvimento)
// Em produção, use Redis com Upstash ou Vercel KV
const cache = new Map<string, RateLimitEntry>();

// Limpar cache periodicamente (evitar memory leak)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now > value.resetTime) {
        cache.delete(key);
      }
    }
  }, 60000); // Limpar a cada 1 minuto
}

/**
 * Extrai identificador único da requisição
 * Usa IP ou user-agent como fallback
 */
function getIdentifier(request: NextRequest): string {
  // Tentar pegar IP real (considerando proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] :
             request.headers.get('x-real-ip') ||
             'unknown';

  return ip;
}

/**
 * Verifica rate limit e retorna informações
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = {
    interval: 60000, // 1 minuto
    uniqueTokenPerInterval: 10, // 10 requisições por minuto
  }
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const identifier = getIdentifier(request);
  const now = Date.now();

  // Buscar entrada do cache
  let entry = cache.get(identifier);

  // Se não existe ou expirou, criar nova entrada
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.interval,
    };
    cache.set(identifier, entry);
  }

  // Incrementar contador
  entry.count++;

  const success = entry.count <= config.uniqueTokenPerInterval;

  return {
    success,
    limit: config.uniqueTokenPerInterval,
    remaining: Math.max(0, config.uniqueTokenPerInterval - entry.count),
    reset: entry.resetTime,
  };
}

/**
 * Rate limits específicos para diferentes endpoints
 */
export const RATE_LIMITS = {
  // Endpoints de autenticação (mais restritivo)
  AUTH: {
    interval: 60000, // 1 minuto
    uniqueTokenPerInterval: 5, // 5 tentativas por minuto
  },

  // Envio de email (muito restritivo)
  EMAIL: {
    interval: 300000, // 5 minutos
    uniqueTokenPerInterval: 3, // 3 emails por 5 minutos
  },

  // Geração de IA (restritivo)
  AI_GENERATION: {
    interval: 60000, // 1 minuto
    uniqueTokenPerInterval: 2, // 2 gerações por minuto
  },

  // APIs públicas (moderado)
  PUBLIC_API: {
    interval: 60000, // 1 minuto
    uniqueTokenPerInterval: 30, // 30 requisições por minuto
  },

  // APIs autenticadas (mais permissivo)
  AUTHENTICATED: {
    interval: 60000, // 1 minuto
    uniqueTokenPerInterval: 60, // 60 requisições por minuto
  },

  // Proxy RPC (Helius) - proteção contra abuso
  RPC_PROXY: {
    interval: 60000, // 1 minuto
    uniqueTokenPerInterval: 20, // 20 requisições por minuto por IP
  },
};

/**
 * Helper para criar resposta de rate limit excedido
 */
export function rateLimitResponse(reset: number) {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString(),
      },
    }
  );
}
