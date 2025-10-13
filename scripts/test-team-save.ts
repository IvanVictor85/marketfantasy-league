import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testTeamSave() {
  try {
    console.log('🧪 Testando salvamento de time...')

    // Dados de teste
    const testData = {
      userWallet: 'H2312uRYYfSFsKiJeMwSriv6F7iEBkWxtPQCV6ArRAjT',
      teamName: 'Time de Teste',
      tokens: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'UNI', 'AAVE', 'SUSHI', 'CRV']
    }

    console.log('📋 Dados do teste:', testData)

    // 1. Verificar se a liga principal existe
    console.log('🔍 1. Verificando liga principal...')
    const league = await prisma.league.findFirst({
      where: { 
        leagueType: 'MAIN',
        isActive: true 
      }
    })

    if (!league) {
      console.log('❌ Liga principal não encontrada')
      return
    }
    console.log('✅ Liga principal encontrada:', { id: league.id, name: league.name })

    // 2. Verificar entrada na liga
    console.log('🔍 2. Verificando entrada na liga...')
    const leagueEntry = await prisma.leagueEntry.findUnique({
      where: {
        leagueId_userWallet: {
          leagueId: league.id,
          userWallet: testData.userWallet
        }
      }
    })

    if (!leagueEntry || leagueEntry.status !== 'CONFIRMED') {
      console.log('❌ Entrada não confirmada:', leagueEntry ? leagueEntry.status : 'não encontrada')
      return
    }
    console.log('✅ Entrada confirmada')

    // 3. Verificar se já existe um time
    console.log('🔍 3. Verificando time existente...')
    const existingTeam = await prisma.team.findUnique({
      where: {
        leagueId_userWallet: {
          leagueId: league.id,
          userWallet: testData.userWallet
        }
      }
    })

    if (existingTeam) {
      console.log('🔄 Time existente encontrado, atualizando...')
      const updatedTeam = await prisma.team.update({
        where: {
          leagueId_userWallet: {
            leagueId: league.id,
            userWallet: testData.userWallet
          }
        },
        data: {
          teamName: testData.teamName,
          tokens: JSON.stringify(testData.tokens),
          hasValidEntry: true,
          updatedAt: new Date()
        }
      })
      console.log('✅ Time atualizado:', updatedTeam.id)
    } else {
      console.log('➕ Criando novo time...')
      const newTeam = await prisma.team.create({
        data: {
          userWallet: testData.userWallet,
          leagueId: league.id,
          teamName: testData.teamName,
          tokens: JSON.stringify(testData.tokens),
          hasValidEntry: true
        }
      })
      console.log('✅ Novo time criado:', newTeam.id)
    }

    // 4. Verificar se o time foi salvo
    console.log('🔍 4. Verificando time salvo...')
    const savedTeam = await prisma.team.findUnique({
      where: {
        leagueId_userWallet: {
          leagueId: league.id,
          userWallet: testData.userWallet
        }
      }
    })

    if (savedTeam) {
      console.log('✅ Time confirmado no banco:', {
        id: savedTeam.id,
        name: savedTeam.teamName,
        tokens: JSON.parse(savedTeam.tokens),
        hasValidEntry: savedTeam.hasValidEntry
      })
    } else {
      console.log('❌ Time não encontrado após salvamento')
    }

    // 5. Contar total de times
    const totalTeams = await prisma.team.count()
    console.log('📊 Total de times no banco:', totalTeams)

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTeamSave()