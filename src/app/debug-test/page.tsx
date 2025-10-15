'use client'

import { useEffect, useState } from 'react'

export default function DebugTest() {
  const [count, setCount] = useState(0)
  const [useEffectExecuted, setUseEffectExecuted] = useState(false)
  
  console.log('🎯 DebugTest: Componente renderizado - Count:', count)
  
  useEffect(() => {
    console.log('🎯 DebugTest: useEffect EXECUTADO!')
    setUseEffectExecuted(true)
    setCount(1)
    console.log('🎯 DebugTest: Count atualizado para 1')
  }, [])
  
  useEffect(() => {
    console.log('🎯 DebugTest: useEffect com dependência [count] executado - Count:', count)
  }, [count])
  
  const handleClick = () => {
    console.log('🎯 DebugTest: Botão clicado!')
    setCount(count + 1)
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Test</h1>
      <div className="mb-4">
        <p><strong>Count:</strong> {count}</p>
        <p><strong>useEffect Executado:</strong> {useEffectExecuted ? '✅ SIM' : '❌ NÃO'}</p>
      </div>
      
      <button 
        onClick={handleClick}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Incrementar
      </button>
      
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Status:</h3>
        <p>Se voce ve SIM acima, o useEffect esta funcionando!</p>
        <p>Verifique o console do navegador para ver os logs.</p>
      </div>
    </div>
  )
}
