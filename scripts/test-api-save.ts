async function testApiSave() {
  try {
    console.log('🧪 Testando API de salvamento via HTTP...')

    const testData = {
      userWallet: 'H2312uRYYfSFsKiJeMwSriv6F7iEBkWxtPQCV6ArRAjT',
      teamName: 'Time API Test',
      tokens: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'UNI', 'AAVE', 'SUSHI', 'CRV']
    }

    console.log('📤 Enviando requisição para API...')
    console.log('📋 Dados:', testData)

    const response = await fetch('http://localhost:3000/api/team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })

    console.log('📥 Resposta recebida:')
    console.log('Status:', response.status, response.statusText)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('📄 Corpo da resposta (raw):', responseText)

    try {
      const data = JSON.parse(responseText)
      console.log('📄 Dados da resposta (parsed):', data)
    } catch (parseError) {
      console.log('❌ Erro ao fazer parse da resposta:', parseError)
    }

    if (response.ok) {
      console.log('✅ Requisição bem-sucedida!')
    } else {
      console.log('❌ Requisição falhou!')
    }

  } catch (error) {
    console.error('💥 Erro na requisição:', error)
  }
}

testApiSave()