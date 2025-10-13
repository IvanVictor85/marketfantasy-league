import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addTestEntry() {
  try {
    console.log('🔍 Adicionando entrada de teste na Liga Principal...')

    // Buscar a Liga Principal
    const mainLeague = await prisma.league.findFirst({
      where: { 
        leagueType: 'MAIN',
        isActive: true 
      }
    })

    if (!mainLeague) {
      console.log('❌ Liga Principal não encontrada')
      return
    }

    console.log('✅ Liga Principal encontrada:', {
      id: mainLeague.id,
      name: mainLeague.name,
      entryFee: mainLeague.entryFee
    })

    // Carteira de teste
    const testWallet = 'TestWallet123456789'

    // Verificar se já existe entrada
    const existingEntry = await prisma.leagueEntry.findUnique({
      where: {
        leagueId_userWallet: {
          leagueId: mainLeague.id,
          userWallet: testWallet
        }
      }
    })

    if (existingEntry) {
      console.log('✅ Entrada de teste já existe:', {
        wallet: existingEntry.userWallet,
        status: existingEntry.status,
        createdAt: existingEntry.createdAt
      })
      return
    }

    // Criar nova entrada
    const newEntry = await prisma.leagueEntry.create({
      data: {
        leagueId: mainLeague.id,
        userWallet: testWallet,
        transactionHash: 'test-transaction-hash-' + Date.now(),
        amountPaid: mainLeague.entryFee,
        status: 'CONFIRMED',
        blockHeight: 123456
      }
    })

    console.log('✅ Entrada de teste criada:', {
      wallet: newEntry.userWallet,
      status: newEntry.status,
      transactionHash: newEntry.transactionHash,
      createdAt: newEntry.createdAt
    })

    // Atualizar contadores da liga
    await prisma.league.update({
      where: { id: mainLeague.id },
      data: {
        participantCount: { increment: 1 },
        totalPrizePool: { increment: mainLeague.entryFee }
      }
    })

    console.log('✅ Liga atualizada com novo participante')

  } catch (error) {
    console.error('❌ Erro ao adicionar entrada de teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestEntry()