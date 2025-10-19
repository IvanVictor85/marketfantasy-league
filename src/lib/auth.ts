import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    // GoogleProvider temporariamente desabilitado
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID || '',
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    // }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Adicionar informações customizadas à sessão
      if (session.user) {
        session.user.id = token.sub || '';
      }
      return session;
    },
  },
  pages: {
    signIn: '/', // Redirecionar para a página principal
    error: '/', // Redirecionar para a página principal em caso de erro
  },
  session: {
    strategy: 'jwt',
  },
};