import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAllTeams() {
  try {
    console.log('🗑️ Iniciando limpeza de todos os times...')

    // Buscar todos os times existentes antes de deletar
    const existingTeams = await prisma.team.findMany({
      include: {
        league: {
          select: {
            name: true,
            leagueType: true
          }
        }
      }
    })

    console.log(`📊 Times encontrados: ${existingTeams.length}`)
    
    if (existingTeams.length > 0) {
      existingTeams.forEach((team: any, index: number) => {
        console.log(`${index + 1}. ${team.teamName} - Liga: ${team.league.name} (${team.league.leagueType}) - Wallet: ${team.userWallet}`)
      })

      // Deletar todos os times
      const deleteResult = await prisma.team.deleteMany({})
      
      console.log(`✅ ${deleteResult.count} times foram deletados com sucesso!`)
    } else {
      console.log('ℹ️ Nenhum time encontrado para deletar.')
    }

    // Verificar se a limpeza foi bem-sucedida
    const remainingTeams = await prisma.team.count()
    console.log(`📈 Times restantes após limpeza: ${remainingTeams}`)

    if (remainingTeams === 0) {
      console.log('🎉 Limpeza concluída com sucesso! Agora você pode criar novos times.')
    } else {
      console.log('⚠️ Alguns times ainda permanecem no banco de dados.')
    }

  } catch (error) {
    console.error('❌ Erro ao limpar times:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAllTeams()