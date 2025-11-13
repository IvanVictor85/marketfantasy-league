import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Força a rota a ser dinâmica (não faz pre-render no build)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 🔒 SEGURANÇA: Verificar autenticação de admin
  const authHeader = request.headers.get('authorization');
  const debugSecret = process.env.DEBUG_SECRET;

  // ⚠️ Se DEBUG_SECRET não estiver configurado, bloquear completamente em produção
  if (process.env.NODE_ENV === 'production' && !debugSecret) {
    return NextResponse.json({
      error: 'Debug endpoint desabilitado em produção sem DEBUG_SECRET'
    }, { status: 403 });
  }

  // Verificar token de autenticação
  if (!authHeader || authHeader !== `Bearer ${debugSecret}`) {
    console.warn('🚨 Tentativa de acesso não autorizado ao endpoint de debug');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        publicKey: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Buscar times do usuário
    const teams = await prisma.team.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        teamName: true,
        tokens: true,
        leagueId: true,
        totalScore: true,
        rank: true,
        hasValidEntry: true,
        selectedMascotUrl: true,
        createdAt: true,
        league: {
          select: {
            id: true,
            name: true,
            leagueType: true,
          }
        }
      }
    });

    // Buscar entradas pagas nas ligas
    const leagueEntries = await prisma.leagueEntry.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        leagueId: true,
        amountPaid: true,
        transactionHash: true,
        status: true,
        createdAt: true,
        league: {
          select: {
            id: true,
            name: true,
            leagueType: true,
          }
        }
      }
    });

    return NextResponse.json({
      user,
      teams: teams.map(t => ({
        ...t,
        tokens: JSON.parse(t.tokens)
      })),
      leagueEntries,
      summary: {
        hasUser: !!user,
        teamsCount: teams.length,
        leagueEntriesCount: leagueEntries.length,
        paidEntries: leagueEntries.filter(e => e.status === 'CONFIRMED').length,
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal error', details: error }, { status: 500 });
  }
}
