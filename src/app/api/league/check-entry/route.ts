import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Connection, PublicKey } from '@solana/web3.js'

// ✅ REFATORAÇÃO: Verificar por competitionId (Rodada), não leagueId (Liga)
const checkEntrySchema = z.object({
  competitionId: z.string()
})

// Função para obter o usuário autenticado
async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    console.log('🔑 [CHECK-ENTRY] Token recebido:', token ? 'Presente' : 'Ausente');
    console.log('🔑 [CHECK-ENTRY] Headers Authorization:', request.headers.get('Authorization'));
    console.log('🔑 [CHECK-ENTRY] Cookie auth-token:', request.cookies.get('auth-token')?.value);

    if (!token) {
      console.log('❌ [CHECK-ENTRY] Nenhum token encontrado');
      return null;
    }

    const authToken = await prisma.authToken.findUnique({
      where: { token },
      include: { user: true }
    });

    console.log('🔍 [CHECK-ENTRY] AuthToken encontrado:', authToken ? 'SIM' : 'NÃO');
    if (authToken) {
      console.log('🔍 [CHECK-ENTRY] Token expira em:', authToken.expiresAt);
      console.log('🔍 [CHECK-ENTRY] Token expirado:', authToken.expiresAt < new Date());
    }

    if (!authToken || authToken.expiresAt < new Date()) {
      console.log('❌ [CHECK-ENTRY] Token inválido ou expirado');
      return null;
    }

    console.log('✅ [CHECK-ENTRY] Usuário autenticado:', authToken.userId);
    return authToken.userId;
  } catch (error) {
    console.error('❌ [AUTH] Erro ao obter usuário:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Ler o body primeiro
    const body = await request.json()
    const { competitionId } = checkEntrySchema.parse(body)

    if (!competitionId) {
      return NextResponse.json(
        { error: 'ID da Rodada (competitionId) é obrigatório' },
        { status: 400 }
      );
    }

    // 🔒 SEGURANÇA: Obter userId do usuário autenticado
    const userId = await getUserFromRequest(request);

    if (!userId) {
      console.error('❌ [CHECK-ENTRY] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    console.log(`🔍 API check-entry: Verificando entrada para userId: ${userId} na Rodada: ${competitionId}`);

    // ✅ REFATORAÇÃO: Consultar 'LeagueEntry' pelo 'competitionId'
    const entry = await prisma.leagueEntry.findFirst({
      where: {
        userId: userId,
        competitionId: competitionId,
        status: 'CONFIRMED'
      }
    });

    if (entry) {
      const dbTime = Date.now() - startTime;
      console.log('✅ API check-entry: Entrada encontrada no DB em', dbTime, 'ms');
      return NextResponse.json({
        hasPaid: true,
        entry: {
          transactionHash: entry.transactionHash,
          amountPaid: entry.amountPaid,
          createdAt: entry.createdAt
        }
      });
    }

    // Entrada não encontrada
    const totalTime = Date.now() - startTime;
    console.log(`ℹ️ API check-entry: Nenhuma entrada encontrada. Tempo total: ${totalTime}ms`);
    return NextResponse.json({
      hasPaid: false,
      entry: null
    })

  } catch (error) {
    console.error('Error checking league entry:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}