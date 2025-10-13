import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMainLeagueEntry() {
  try {
    console.log('🔍 Verificando entradas na Liga Principal...')

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

    // Verificar entradas existentes
    const entries = await prisma.leagueEntry.findMany({
      where: {
        leagueId: mainLeague.id
      }
    })

    console.log(`📊 Total de entradas: ${entries.length}`)
    
    entries.forEach((entry: any, index: number) => {
      console.log(`${index + 1}. Wallet: ${entry.userWallet}, Status: ${entry.status}, Criado em: ${entry.createdAt}`)
    })

    // Verificar times existentes
    const teams = await prisma.team.findMany({
      where: {
        leagueId: mainLeague.id
      }
    })

    console.log(`🏆 Total de times: ${teams.length}`)
    
    teams.forEach((team: any, index: number) => {
      console.log(`${index + 1}. Wallet: ${team.userWallet}, Nome: ${team.teamName}, Entrada válida: ${team.hasValidEntry}`)
    })

  } catch (error) {
    console.error('❌ Erro ao verificar entradas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMainLeagueEntry()