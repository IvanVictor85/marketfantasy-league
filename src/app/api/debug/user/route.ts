import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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
