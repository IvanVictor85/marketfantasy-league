# Otimização da Helius API - Plano Gratuito

## Limites do Plano Gratuito
- **1M Credits/mês** (~33.333 credits/dia)
- **10 Requests/sec**
- **Community Support**

## Estratégias de Otimização

### 1. **Cache Inteligente**
```typescript
// Implementar cache local para reduzir chamadas
const CACHE_DURATION = 30000; // 30 segundos
const transactionCache = new Map();

const getCachedTransactions = (address: string) => {
  const cached = transactionCache.get(address);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};
```

### 2. **Debounce em Requests**
```typescript
// Evitar múltiplas chamadas rápidas
const debouncedFetch = useMemo(
  () => debounce(fetchTransactions, 1000),
  []
);
```

### 3. **Paginação Eficiente**
- Carregar apenas 10-20 transações por vez
- Implementar scroll infinito em vez de carregar tudo
- Cache de páginas já carregadas

### 4. **Uso Condicional**
```typescript
// Só buscar quando necessário
const shouldFetch = useMemo(() => {
  return wallet.connected && !loading && !error;
}, [wallet.connected, loading, error]);
```

### 5. **Fallbacks Locais**
```typescript
// Para desenvolvimento, usar dados mockados quando possível
const useMockData = process.env.NODE_ENV === 'development' && !process.env.HELIUS_API_KEY;

if (useMockData) {
  return mockTransactionData;
}
```

## Monitoramento de Uso

### Implementar Contador de Credits
```typescript
let dailyCreditsUsed = 0;
const DAILY_LIMIT = 33333; // ~1M/30 dias

const trackApiUsage = () => {
  dailyCreditsUsed++;
  if (dailyCreditsUsed > DAILY_LIMIT * 0.8) {
    console.warn('Approaching daily credit limit');
  }
};
```

### Dashboard de Uso
- Criar componente para monitorar uso diário
- Alertas quando próximo do limite
- Estatísticas de consumo por funcionalidade

## Priorização de Features

### **Alta Prioridade (Sempre usar Helius):**
1. **Priority Fee API** - Essencial para transações
2. **Webhooks críticos** - Depósitos e saques importantes

### **Média Prioridade (Usar com cache):**
1. **Enhanced Transactions** - Com cache de 30s-1min
2. **Análise de transações** - Batch processing

### **Baixa Prioridade (Usar dados locais quando possível):**
1. **Histórico extenso** - Limitar a últimas 50 transações
2. **Analytics detalhados** - Processar localmente

## Configuração de Desenvolvimento

### Variáveis de Ambiente
```env
# Desenvolvimento - usar dados mock quando possível
NODE_ENV=development
USE_MOCK_DATA=true
HELIUS_RATE_LIMIT=true

# Produção - usar Helius com otimizações
NODE_ENV=production
USE_MOCK_DATA=false
HELIUS_RATE_LIMIT=true
```

### Rate Limiting Local
```typescript
class HeliusRateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 10;
  private readonly timeWindow = 1000; // 1 segundo

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}
```

## Alternativas para Economizar Credits

### 1. **RPC Direto para Operações Simples**
```typescript
// Para operações básicas, usar RPC direto
const getBalance = async (address: string) => {
  // Usar connection.getBalance() em vez de Helius
  return await connection.getBalance(new PublicKey(address));
};
```

### 2. **Dados Locais para Desenvolvimento**
```typescript
// Mock data para desenvolvimento
const mockTransactions = [
  {
    signature: 'mock_signature_1',
    timestamp: Date.now(),
    type: 'TRANSFER',
    // ... outros campos
  }
];
```

### 3. **Batch Processing**
```typescript
// Agrupar múltiplas operações
const batchRequests = async (addresses: string[]) => {
  // Processar em lotes de 5-10 endereços
  const batches = chunk(addresses, 5);
  const results = [];
  
  for (const batch of batches) {
    const batchResult = await heliusService.getBatchTransactions(batch);
    results.push(...batchResult);
    
    // Delay entre batches para respeitar rate limit
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
};
```

## Migração para Plano Pago

### Quando Considerar Upgrade:
- **Usuários ativos > 100/dia**
- **Transações > 1000/dia**
- **Credits esgotando antes do fim do mês**
- **Rate limit impactando UX**

### Métricas para Monitorar:
- Credits usados por dia
- Requests por segundo (picos)
- Tempo de resposta das APIs
- Erros de rate limiting

## Conclusão

O plano gratuito da Helius é **suficiente para:**
- ✅ Desenvolvimento completo
- ✅ Testes e validação
- ✅ MVP e primeiros usuários
- ✅ Demos e apresentações

**Limitações a considerar:**
- ⚠️ Não ideal para produção com muitos usuários
- ⚠️ Requer otimizações cuidadosas
- ⚠️ Monitoramento constante de uso

**Recomendação:** Comece com o plano gratuito e implemente as otimizações sugeridas. Monitore o uso e faça upgrade quando necessário.