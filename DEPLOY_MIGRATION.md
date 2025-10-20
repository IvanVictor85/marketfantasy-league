# 🚀 Guia de Deploy - Migração do Sistema de Autenticação

## ✅ O QUE JÁ ESTÁ PRONTO

### 1. Configuração Automática
- ✅ `package.json` já configurado com `prisma migrate deploy`
- ✅ `vercel.json` usa o build command correto
- ✅ Migrações criadas em `prisma/migrations/`

### 2. Processo de Deploy Automático
Quando você fizer push para o GitHub, o Vercel vai:

```bash
1. npm ci                           # Instalar dependências
2. prisma generate                  # Gerar Prisma Client
3. prisma migrate deploy           # ⭐ EXECUTAR MIGRAÇÕES
4. next build                      # Build do Next.js
```

## 🔐 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Certifique-se de que as seguintes variáveis estão configuradas no **Vercel Dashboard**:

### 1. Banco de Dados (CRÍTICO)
```bash
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

### 2. Email (para autenticação)
```bash
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app_aqui
```

### 3. Outras variáveis do .env.example
- `NEXT_PUBLIC_SOLANA_NETWORK`
- `NEXT_PUBLIC_SOLANA_RPC_URL`
- `HELIUS_API_KEY`
- `GEMINI_API_KEY`
- etc.

## 📋 CHECKLIST DE DEPLOY

### Antes do Deploy
- [x] ✅ Código commitado no GitHub
- [x] ✅ Migrações criadas localmente
- [ ] ⚠️ Variáveis de ambiente configuradas no Vercel
- [ ] ⚠️ `DATABASE_URL` apontando para banco de produção (Neon)

### Durante o Deploy
O Vercel vai executar automaticamente:
- [x] Instalar dependências
- [x] Gerar Prisma Client
- [x] **Executar migrações** (cria tabelas: users, verification_codes, auth_tokens)
- [x] Build do Next.js

### Após o Deploy
- [ ] Testar fluxo de autenticação completo
- [ ] Verificar logs do Vercel para erros de migração
- [ ] Confirmar que tabelas foram criadas no banco

## 🔍 VERIFICAR SE MIGRAÇÃO FOI APLICADA

### No Vercel (Logs de Build)
Procure por:
```
✓ Applying migration `20251020002351_add_verification_and_auth_models`
✓ Database is now in sync with your schema
```

### No Banco de Dados (Neon Dashboard)
Execute esta query SQL:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'verification_codes', 'auth_tokens');
```

Deve retornar 3 tabelas.

## ⚠️ TROUBLESHOOTING

### Erro: "Migration failed"
**Causa**: `DATABASE_URL` não configurado ou inválido

**Solução**:
1. Vá para Vercel Dashboard → Settings → Environment Variables
2. Adicione `DATABASE_URL` com a connection string do Neon
3. Faça redeploy

### Erro: "Prisma Client not generated"
**Causa**: Build command não executou `prisma generate`

**Solução**: Já resolvido! O `package.json` tem `postinstall: prisma generate`

### Erro: "Table already exists"
**Causa**: Migração rodou duas vezes

**Solução**: Normal! O Prisma detecta e ignora migrações já aplicadas

## 🎯 PRÓXIMOS PASSOS

1. **Fazer push para GitHub** (✅ JÁ FEITO!)
2. **Aguardar deploy do Vercel** (automático)
3. **Verificar logs de build** no Vercel Dashboard
4. **Testar autenticação** no site em produção
5. **Monitorar erros** via Vercel Logs

## 📞 SUPORTE

Se algo der errado, verifique:
- Logs do Vercel: https://vercel.com/[seu-projeto]/deployments
- Logs do Neon: https://console.neon.tech/app/projects
- Logs da aplicação: Vercel Dashboard → Functions → Logs

---

**Data da migração**: 2025-10-20
**Commit**: d358140
**Tabelas adicionadas**: users, verification_codes, auth_tokens
