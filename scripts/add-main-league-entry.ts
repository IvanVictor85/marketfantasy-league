import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addMainLeagueEntry() {
  try {
    console.log('🔍 Adicionando entrada na Liga Principal...')

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

    // Carteira do usuário atual (você pode alterar este valor)
    const userWallet = 'H2312uRYYfSFsKiJeMwSriv6F7iEBkWxtPQCV6ArRAjT' // Substitua pela carteira atual

    // Verificar se já existe entrada
    const existingEntry = await prisma.leagueEntry.findUnique({
      where: {
        leagueId_userWallet: {
          leagueId: mainLeague.id,
          userWallet: userWallet
        }
      }
    })

    if (existingEntry) {
      console.log('✅ Entrada já existe:', {
        wallet: existingEntry.userWallet,
        status: existingEntry.status,
        createdAt: existingEntry.createdAt
      })
      
      if (existingEntry.status !== 'CONFIRMED') {
        // Atualizar status para CONFIRMED
        const updatedEntry = await prisma.leagueEntry.update({
          where: {
            leagueId_userWallet: {
              leagueId: mainLeague.id,
              userWallet: userWallet
            }
          },
          data: {
            status: 'CONFIRMED'
          }
        })
        console.log('✅ Status da entrada atualizado para CONFIRMED')
      }
    } else {
      // Criar nova entrada
      const newEntry = await prisma.leagueEntry.create({
        data: {
          leagueId: mainLeague.id,
          userWallet: userWallet,
          status: 'CONFIRMED',
          transactionHash: 'manual-entry-' + Date.now(),
          amountPaid: mainLeague.entryFee
        }
      })
      console.log('✅ Nova entrada criada:', {
        id: newEntry.id,
        wallet: newEntry.userWallet,
        status: newEntry.status
      })
    }

    console.log('🎉 Processo concluído!')

  } catch (error) {
    console.error('❌ Erro ao adicionar entrada:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addMainLeagueEntry()