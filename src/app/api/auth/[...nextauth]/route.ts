// NextAuth temporariamente desabilitado para focar no sistema de email
// import NextAuth from 'next-auth';
// import { authOptions } from '@/lib/auth';

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };

// Handler temporário que retorna erro 404 para evitar problemas
export async function GET() {
  return new Response('NextAuth temporariamente desabilitado', { status: 404 });
}

export async function POST() {
  return new Response('NextAuth temporariamente desabilitado', { status: 404 });
}