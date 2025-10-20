import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const checkEntrySchema = z.object({
  userId: z.string().optional(),
  userWallet: z.string().optional(),
  leagueId: z.string().optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { userId, userWallet, leagueId } = checkEntrySchema.parse(body);

    if (!userId && !userWallet) {
      return NextResponse.json(
        { error: 'userId ou userWallet é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 [CHECK-ENTRY] Verificando entrada:', { userId, userWallet, leagueId });

    // Buscar league
    let league;
    if (leagueId) {
      league = await prisma.league.findUnique({
        where: { id: leagueId }
      });
    } else {
      league = await prisma.league.findFirst({
        where: {
          leagueType: 'MAIN',
          isActive: true
        }
      });
    }

    if (!league) {
      return NextResponse.json(
        { error: 'Liga não encontrada' },
        { status: 404 }
      );
    }

    // OPÇÃO 1: Verificar por userId (PREFERENCIAL - mais confiável)
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      // Buscar entrada usando a carteira do usuário
      if (user.publicKey) {
        const entry = await prisma.leagueEntry.findFirst({
          where: {
            leagueId: league.id,
            userWallet: user.publicKey
          }
        });

        if (entry && entry.status === 'CONFIRMED') {
          console.log('✅ [CHECK-ENTRY] Entrada encontrada por userId:', entry.transactionHash);
          return NextResponse.json({
            hasPaid: true,
            entry: {
              transactionHash: entry.transactionHash,
              amountPaid: entry.amountPaid,
              createdAt: entry.createdAt
            },
            league: {
              id: league.id,
              name: league.name,
              entryFee: league.entryFee
            }
          });
        }
      }
    }

    // OPÇÃO 2: Verificar por userWallet (fallback)
    if (userWallet) {
      const entry = await prisma.leagueEntry.findFirst({
        where: {
          leagueId: league.id,
          userWallet: userWallet
        }
      });

      if (entry && entry.status === 'CONFIRMED') {
        console.log('✅ [CHECK-ENTRY] Entrada encontrada por wallet:', entry.transactionHash);
        return NextResponse.json({
          hasPaid: true,
          entry: {
            transactionHash: entry.transactionHash,
            amountPaid: entry.amountPaid,
            createdAt: entry.createdAt
          },
          league: {
            id: league.id,
            name: league.name,
            entryFee: league.entryFee
          }
        });
      }
    }

    console.log('❌ [CHECK-ENTRY] Entrada não encontrada');
    return NextResponse.json({
      hasPaid: false,
      league: {
        id: league.id,
        name: league.name,
        entryFee: league.entryFee
      }
    });

  } catch (error) {
    console.error('❌ [CHECK-ENTRY] Erro:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
