/**
 * Mutex - Lock para Chamadas Concorrentes
 *
 * Previne múltiplas chamadas simultâneas à CoinGecko API.
 *
 * Problema que resolve:
 * - Quando múltiplos usuários acessam simultaneamente
 * - Quando componentes React re-renderizam em paralelo
 * - Quando Hot Refresh causa múltiplas chamadas
 *
 * Solução:
 * - Primeira chamada adquire o lock e faz o fetch
 * - Chamadas subsequentes AGUARDAM a primeira terminar
 * - Todas recebem o mesmo resultado (deduplicação)
 */

import { CACHE_CONFIG } from './types';

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class Mutex {
  private locks: Map<string, PendingRequest<unknown>> = new Map();
  private timeout: number;

  constructor(timeout: number = CACHE_CONFIG.MUTEX_TIMEOUT) {
    this.timeout = timeout;
  }

  /**
   * Executa uma função com lock exclusivo
   *
   * Se o lock já está ocupado por outra chamada, aguarda ela terminar
   * e retorna o mesmo resultado (deduplicação de requests)
   *
   * @param key - Identificador do lock (ex: 'top100', 'token:bitcoin')
   * @param fn - Função a executar quando adquirir o lock
   * @returns Resultado da função
   */
  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.locks.get(key);

    // Se já existe uma chamada em andamento, aguardar ela
    if (existing) {
      const age = Date.now() - existing.timestamp;

      // Se o request pendente é muito antigo, provavelmente travou
      if (age > this.timeout) {
        console.warn(`⚠️ [MUTEX] Lock ${key} expirado (${age}ms), removendo...`);
        this.locks.delete(key);
      } else {
        console.log(`⏳ [MUTEX] Aguardando lock existente: ${key} (idade: ${age}ms)`);
        try {
          return await existing.promise as T;
        } catch (error) {
          // Se o request original falhou, tentar novamente
          console.warn(`⚠️ [MUTEX] Request original falhou para ${key}, tentando novamente...`);
          this.locks.delete(key);
        }
      }
    }

    // Criar novo lock
    console.log(`🔒 [MUTEX] Adquirindo lock: ${key}`);

    const pendingPromise = fn()
      .then(result => {
        console.log(`✅ [MUTEX] Lock liberado: ${key}`);
        this.locks.delete(key);
        return result;
      })
      .catch(error => {
        console.error(`❌ [MUTEX] Erro no lock ${key}:`, error);
        this.locks.delete(key);
        throw error;
      });

    this.locks.set(key, {
      promise: pendingPromise,
      timestamp: Date.now(),
    });

    return pendingPromise;
  }

  /**
   * Verifica se um lock está ativo
   */
  isLocked(key: string): boolean {
    const existing = this.locks.get(key);
    if (!existing) return false;

    const age = Date.now() - existing.timestamp;
    if (age > this.timeout) {
      this.locks.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Força liberação de um lock (use com cuidado)
   */
  release(key: string): void {
    this.locks.delete(key);
    console.log(`🔓 [MUTEX] Lock forçadamente liberado: ${key}`);
  }

  /**
   * Limpa todos os locks (use com cuidado, apenas para testes)
   */
  clearAll(): void {
    this.locks.clear();
    console.log(`🔓 [MUTEX] Todos os locks liberados`);
  }

  /**
   * Retorna estatísticas dos locks ativos
   */
  getStats(): { count: number; keys: string[]; ages: Record<string, number> } {
    const now = Date.now();
    const ages: Record<string, number> = {};

    for (const [key, pending] of this.locks.entries()) {
      ages[key] = now - pending.timestamp;
    }

    return {
      count: this.locks.size,
      keys: Array.from(this.locks.keys()),
      ages,
    };
  }
}

// Singleton instance
let mutexInstance: Mutex | null = null;

/**
 * Retorna instância singleton do Mutex
 */
export function getMutex(): Mutex {
  if (!mutexInstance) {
    mutexInstance = new Mutex();
  }
  return mutexInstance;
}

export { Mutex };
