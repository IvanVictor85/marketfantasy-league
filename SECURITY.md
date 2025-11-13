# 🔒 Guia de Segurança - CryptoFantasy League

## Visão Geral

Este documento descreve as práticas de segurança implementadas no projeto e diretrizes para manter o sistema seguro.

## ✅ Recursos de Segurança Implementados

### 1. Rate Limiting
Proteção contra ataques de força bruta e spam:
- **Email (send-code)**: 3 emails por 5 minutos
- **Geração de IA (mascotes)**: 2 gerações por minuto
- **Autenticação (nonce, verify-code)**: 5 tentativas por minuto
- **APIs públicas**: 30 requisições por minuto
- **APIs autenticadas**: 60 requisições por minuto

**Localização**: `src/lib/rate-limit.ts`

### 2. Sistema de Logs Seguro
- Remove automaticamente dados sensíveis (passwords, tokens, signatures)
- Logs condicionais por ambiente (debug apenas em desenvolvimento)
- Logs de segurança sempre ativos

**Localização**: `src/lib/logger.ts`

**Uso**:
```typescript
import { logger } from '@/lib/logger';

logger.debug('Mensagem de debug', { data });
logger.info('Informação');
logger.warn('Aviso');
logger.error('Erro', error);
logger.security('Evento de segurança', { details });
```

### 3. Autenticação de Endpoints Administrativos
- Endpoint `/api/debug/*` protegido com `DEBUG_SECRET`
- Bloqueio automático em produção sem variável configurada

### 4. Sign-In with Solana (SIWS)
- Nonces de uso único com expiração de 5 minutos
- Verificação criptográfica de assinaturas
- Proteção contra replay attacks

### 5. CORS Restrito (Helper Disponível)
Helper criado para restrição de origens em produção.

**Localização**: `src/lib/cors.ts`

## ⚠️ Variáveis de Ambiente Críticas

### Obrigatórias em Produção:
```env
# Autenticação
NEXTAUTH_SECRET=[GERAR_SEGREDO_ALEATORIO_64_CHARS]
NEXTAUTH_URL=https://seu-dominio.com

# Banco de Dados
DATABASE_URL=postgresql://user:pass@host/db

# APIs Externas
GEMINI_API_KEY=[SUA_CHAVE_GEMINI]
HELIUS_API_KEY=[SUA_CHAVE_HELIUS]

# Email
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=[APP_PASSWORD_GMAIL]

# Segurança
DEBUG_SECRET=[GERAR_SEGREDO_ALEATORIO]
CRON_SECRET=[GERAR_SEGREDO_ALEATORIO]
```

### Gerar Secrets Seguros:
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

## 🚨 Avisos de Segurança Importantes

### 1. Treasury Keypair (Solana)
⚠️ **CRÍTICO**: A função `createSimpleTreasuryKeypair()` em `src/lib/solana/program.ts` usa seed determinística.

**USO APENAS EM DEVNET!**

Para produção (Mainnet):
- Use Anchor Program com PDAs
- Ou armazene keypair em AWS Secrets Manager / HashiCorp Vault
- NUNCA use seeds determinísticas com fundos reais

### 2. API Keys
- NUNCA commite API keys no código
- Use sempre variáveis de ambiente
- Revogue imediatamente se exposta

### 3. Logs em Produção
Configure `ENABLE_DEBUG_LOGS=false` em produção para minimizar exposição de dados.

## 📋 Checklist de Segurança para Deploy

Antes de fazer deploy em produção:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] `DEBUG_SECRET` e `CRON_SECRET` configurados
- [ ] API keys antigas revogadas
- [ ] `ENABLE_DEBUG_LOGS=false` em produção
- [ ] CORS configurado para domínios específicos
- [ ] Rate limiting ativo em todos endpoints críticos
- [ ] Certificado SSL configurado (HTTPS)
- [ ] Backup do banco de dados configurado
- [ ] Monitoring e alertas configurados

## 🛡️ Endpoints Protegidos

### Com Rate Limiting:
- `/api/auth/send-code` - 3 emails / 5min
- `/api/auth/verify-code` - 5 tentativas / min
- `/api/auth/nonce` - 5 tentativas / min
- `/api/generate-mascot` - 2 gerações / min

### Com Autenticação Especial:
- `/api/debug/*` - Requer `DEBUG_SECRET`
- `/api/cron/*` - Requer `CRON_SECRET`

## 📊 Monitoramento de Segurança

### Logs de Segurança Importantes:
```typescript
// Tentativas de autenticação falhadas
logger.security('Tentativa de autenticação com nonce inválido', { publicKey });

// Rate limiting ativado
logger.security('Tentativa de força bruta bloqueada');

// Acesso não autorizado
logger.security('Tentativa de acesso não autorizado', { endpoint, ip });
```

### Métricas Recomendadas:
- Taxa de requisições por endpoint
- Número de rate limits ativados
- Tentativas de autenticação falhadas
- Tempo de resposta de APIs

## 🔐 Boas Práticas

### Para Desenvolvedores:
1. Sempre use `logger` em vez de `console.log`
2. Aplique rate limiting em novos endpoints públicos
3. Valide inputs com Zod
4. Nunca logue dados sensíveis
5. Use prepared statements (Prisma cuida disso)

### Para Operações:
1. Rotacione secrets regularmente (90 dias)
2. Monitore logs de segurança diariamente
3. Mantenha backups do banco de dados
4. Teste recuperação de desastres periodicamente
5. Mantenha dependências atualizadas

## 📞 Reportar Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança:

1. **NÃO** abra uma issue pública
2. Envie email para: [SEU_EMAIL_DE_SEGURANÇA]
3. Inclua:
   - Descrição da vulnerabilidade
   - Steps para reproduzir
   - Impacto potencial
   - Sugestões de correção (opcional)

Responderemos em até 48 horas.

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/data-fetching/security)
- [Solana Security Best Practices](https://docs.solana.com/developing/programming-model/security)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/deployment#security)

---

**Última atualização**: 2025-01-13
**Versão**: 1.0.0
