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

    // Buscar ou criar usuário para esta carteira
    let user = await prisma.user.findFirst({
      where: { publicKey: userWallet }
    })

    if (!user) {
      console.log('👤 Usuário não encontrado, criando novo usuário...')
      user = await prisma.user.create({
        data: {
          email: `user-${userWallet.slice(0, 8)}@example.com`,
          name: `User ${userWallet.slice(0, 8)}`,
          publicKey: userWallet
        }
      })
      console.log('✅ Novo usuário criado:', { id: user.id, email: user.email })
    } else {
      console.log('✅ Usuário encontrado:', { id: user.id, email: user.email })
    }

    // Verificar se já existe entrada
    const existingEntry = await prisma.leagueEntry.findFirst({
      where: {
        leagueId: mainLeague.id,
        userId: user.id
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
            id: existingEntry.id
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
          userId: user.id,
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