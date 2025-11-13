/**
 * 🔒 Sistema de Logs Seguro
 *
 * - Em desenvolvimento: Logs detalhados
 * - Em produção: Apenas logs críticos (sem dados sensíveis)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ENABLE_DEBUG_LOGS = process.env.ENABLE_DEBUG_LOGS === 'true';

/**
 * Logger condicional que respeita o ambiente
 */
class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (IS_PRODUCTION && !ENABLE_DEBUG_LOGS) {
      // Em produção, só loga warn e error
      return level === 'warn' || level === 'error';
    }
    return true; // Em desenvolvimento, loga tudo
  }

  /**
   * Remove dados sensíveis de objetos antes de logar
   */
  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'apiKey',
      'privateKey',
      'nonce',
      'signature',
      'authorization',
      'cookie',
      'sessionId',
    ];

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();

      // Remover chaves sensíveis
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }

      // Recursivamente sanitizar objetos aninhados
      else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(`🔍 [DEBUG] ${message}`, ...args.map(arg => this.sanitize(arg)));
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(`ℹ️ [INFO] ${message}`, ...args.map(arg => this.sanitize(arg)));
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ [WARN] ${message}`, ...args.map(arg => this.sanitize(arg)));
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog('error')) {
      console.error(`❌ [ERROR] ${message}`);

      if (error) {
        if (error instanceof Error) {
          console.error('Stack:', error.stack);
          if (IS_PRODUCTION) {
            // Em produção, não loga o erro completo (pode conter dados sensíveis)
            console.error('Message:', error.message);
          } else {
            console.error('Full Error:', this.sanitize(error));
          }
        } else {
          console.error('Error Data:', this.sanitize(error));
        }
      }
    }
  }

  /**
   * Log de segurança (sempre loga, mesmo em produção)
   */
  security(message: string, data?: any) {
    console.warn(`🚨 [SECURITY] ${message}`, data ? this.sanitize(data) : '');
  }
}

export const logger = new Logger();

/**
 * Helper para substituir console.log em APIs
 *
 * Uso:
 * import { logger } from '@/lib/logger';
 *
 * logger.debug('Mensagem de debug', { data });
 * logger.info('Info message');
 * logger.warn('Warning!');
 * logger.error('Error occurred', error);
 * logger.security('Tentativa de acesso não autorizado', { ip, path });
 */
