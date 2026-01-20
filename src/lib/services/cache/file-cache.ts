/**
 * FileCache - Cache Persistente em Arquivo
 *
 * Usado como L2 (camada persistente) quando Redis não está disponível.
 * Persiste dados em /tmp/mfl-coingecko-cache.json
 *
 * Benefícios:
 * - Persiste entre Hot Refresh do Next.js
 * - Sobrevive a reinícios do servidor de desenvolvimento
 * - Funciona em Vercel serverless (tmp é compartilhado por alguns segundos)
 *
 * Limitações:
 * - Não compartilhado entre múltiplas instâncias serverless em produção
 * - Para produção robusta, use Redis como L2
 */

import * as fs from 'fs';
import * as path from 'path';
import { CacheEntry, CacheLayer, CACHE_CONFIG } from './types';

interface FileCacheData {
  [key: string]: CacheEntry<unknown>;
}

class FileCache<T> implements CacheLayer<T> {
  private filePath: string;
  private memoryBuffer: Map<string, CacheEntry<T>> = new Map();
  private lastFlush: number = 0;
  private flushInterval: number = 1000; // Flush no máximo a cada 1 segundo
  private cleanupTimer: NodeJS.Timeout | null = null;
  private pendingFlush: NodeJS.Timeout | null = null; // Timer para flush agendado
  private isDirty: boolean = false; // Flag para indicar mudanças não persistidas

  constructor(filePath: string = CACHE_CONFIG.FILE_CACHE_PATH) {
    this.filePath = filePath;
    this.loadFromFile();
    this.startCleanupTimer();
  }

  /**
   * Carrega dados do arquivo para memória
   */
  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        const data: FileCacheData = JSON.parse(content);

        const now = Date.now();
        let loadedCount = 0;
        let expiredCount = 0;

        for (const [key, entry] of Object.entries(data)) {
          // Só carregar entries não expiradas
          if (entry.expiresAt > now) {
            this.memoryBuffer.set(key, entry as CacheEntry<T>);
            loadedCount++;
          } else {
            expiredCount++;
          }
        }

        console.log(`📂 [FILE_CACHE] Carregado: ${loadedCount} entries válidas, ${expiredCount} expiradas ignoradas`);
      } else {
        console.log(`📂 [FILE_CACHE] Arquivo não existe, iniciando vazio: ${this.filePath}`);
      }
    } catch (error) {
      console.warn(`⚠️ [FILE_CACHE] Erro ao carregar arquivo:`, error instanceof Error ? error.message : error);
      // Continuar com cache vazio
    }
  }

  /**
   * Agenda um flush para acontecer após o intervalo de debounce
   */
  private scheduleFlush(): void {
    // Se já há um flush agendado, não agendar outro
    if (this.pendingFlush) {
      return;
    }

    const timeUntilNextFlush = this.flushInterval - (Date.now() - this.lastFlush);
    const delay = Math.max(timeUntilNextFlush, 50); // Mínimo 50ms

    this.pendingFlush = setTimeout(async () => {
      this.pendingFlush = null;
      await this.executeFlush();
    }, delay);

    // Não bloquear shutdown
    if (this.pendingFlush.unref) {
      this.pendingFlush.unref();
    }
  }

  /**
   * Executa o flush efetivo para o arquivo
   */
  private async executeFlush(): Promise<void> {
    // Se não há mudanças, não fazer nada
    if (!this.isDirty) {
      return;
    }

    const now = Date.now();
    this.lastFlush = now;
    this.isDirty = false;

    try {
      const data: FileCacheData = {};

      for (const [key, entry] of this.memoryBuffer.entries()) {
        // Só persistir entries não expiradas
        if (entry.expiresAt > now) {
          data[key] = entry;
        }
      }

      // Garantir que o diretório existe
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Escrever atomicamente (write to temp, then rename)
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);

      console.log(`💾 [FILE_CACHE] Persistido: ${Object.keys(data).length} entries`);
    } catch (error) {
      console.error(`❌ [FILE_CACHE] Erro ao persistir:`, error instanceof Error ? error.message : error);
      // Marcar como dirty novamente para tentar na próxima
      this.isDirty = true;
    }
  }

  /**
   * Persiste dados em arquivo (com debounce inteligente)
   */
  private async flushToFile(): Promise<void> {
    const now = Date.now();

    // Marcar que há mudanças pendentes
    this.isDirty = true;

    // Debounce: se ainda não passou o intervalo, agendar flush futuro
    if (now - this.lastFlush < this.flushInterval) {
      this.scheduleFlush();
      return;
    }

    // Passou o intervalo, executar imediatamente
    await this.executeFlush();
  }

  /**
   * Timer de limpeza periódica
   */
  private startCleanupTimer(): void {
    // Evitar múltiplos timers
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.FILE_CACHE_CLEANUP_INTERVAL);

    // Não bloquear shutdown
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Remove entries expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.memoryBuffer.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryBuffer.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 [FILE_CACHE] Cleanup: ${removed} entries removidas`);
      this.flushToFile();
    }
  }

  async get(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.memoryBuffer.get(key);

    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (entry.expiresAt <= Date.now()) {
      this.memoryBuffer.delete(key);
      return null;
    }

    return entry;
  }

  async set(key: string, entry: CacheEntry<T>): Promise<void> {
    this.memoryBuffer.set(key, entry);

    // Persistir em background (não bloqueia)
    this.flushToFile().catch(err => {
      console.error(`❌ [FILE_CACHE] Erro no flush:`, err);
    });
  }

  async delete(key: string): Promise<void> {
    this.memoryBuffer.delete(key);
    this.flushToFile().catch(err => {
      console.error(`❌ [FILE_CACHE] Erro no flush após delete:`, err);
    });
  }

  async has(key: string): Promise<boolean> {
    const entry = await this.get(key);
    return entry !== null;
  }

  async clear(): Promise<void> {
    this.memoryBuffer.clear();

    try {
      if (fs.existsSync(this.filePath)) {
        fs.unlinkSync(this.filePath);
        console.log(`🗑️ [FILE_CACHE] Arquivo deletado: ${this.filePath}`);
      }
    } catch (error) {
      console.error(`❌ [FILE_CACHE] Erro ao deletar arquivo:`, error);
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.memoryBuffer.size,
      keys: Array.from(this.memoryBuffer.keys()),
    };
  }

  /**
   * Força persistência imediata (útil para testes ou shutdown gracioso)
   */
  async forceFlush(): Promise<void> {
    // Cancelar qualquer flush pendente
    if (this.pendingFlush) {
      clearTimeout(this.pendingFlush);
      this.pendingFlush = null;
    }

    // Marcar como dirty para garantir que vai escrever
    this.isDirty = true;
    this.lastFlush = 0; // Reset debounce
    await this.executeFlush();
  }
}

// Singleton instance
let fileCacheInstance: FileCache<unknown> | null = null;

/**
 * Retorna instância singleton do FileCache
 */
export function getFileCache<T>(): FileCache<T> {
  if (!fileCacheInstance) {
    fileCacheInstance = new FileCache<T>();
  }
  return fileCacheInstance as FileCache<T>;
}

export { FileCache };
