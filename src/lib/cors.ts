/**
 * 🔒 Configuração de CORS restrita para APIs
 *
 * Em desenvolvimento: Permite localhost
 * Em produção: Apenas domínios autorizados
 */

const ALLOWED_ORIGINS =  process.env.NODE_ENV === 'production'
  ? [
      'https://www.mflprotocol.xyz',
      'https://mflprotocol.xyz',
      process.env.NEXTAUTH_URL || '',
    ].filter(Boolean)
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

export function getCorsHeaders(origin: string | null): HeadersInit {
  // Verificar se a origem é permitida
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  if (!isAllowed && process.env.NODE_ENV === 'production') {
    console.warn(`🚨 CORS: Origem não autorizada: ${origin}`);
  }

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 horas
  };
}

export function corsResponse(body: any, status: number = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(origin),
    },
  });
}
