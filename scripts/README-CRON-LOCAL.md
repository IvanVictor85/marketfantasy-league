# 🕐 CRON LOCAL - Guia de Uso

## O que é?

Este sistema simula os cron jobs do Vercel localmente, permitindo finalizar rodadas automaticamente sem precisar do deploy em produção.

## ✅ Como Usar

### 1. Ajustar a data de término da rodada

```bash
node scripts/set-rodada4-end-today.js
```

Isso define a Rodada 4 para terminar **hoje às 19:30**.

### 2. Iniciar o cron local

```bash
node scripts/local-cron.js
```

Isso inicia um processo que verifica **a cada 1 minuto** se há competições para finalizar.

### 3. Acompanhar os logs

O cron mostrará logs como:

```
🕐 CRON LOCAL INICIADO
═══════════════════════════════════════════════════════
Este script simula os cron jobs do Vercel localmente.
Ele verifica a cada 1 minuto se há competições para finalizar.
═══════════════════════════════════════════════════════

🔍 [19:10:00] Verificando competições...
   ✅ Nenhuma competição para finalizar no momento.
   ⏱️  Próxima: Rodada 4 em 20 minutos (19:30:00)
```

Quando chegar às 19:30:

```
🔍 [19:30:00] Verificando competições...

🎯 Encontradas 1 competição(ões) para finalizar:

   📋 Rodada 4
   🕐 Término: 26/12/2025, 19:30:00
   🆔 ID: cmicalux3000810oueqd2dkax

🚀 Executando snapshot final para competição cmicalux3000810oueqd2dkax...

[Logs do snapshot-final.js...]

✅ Rodada 4 finalizada com sucesso!
```

### 4. Parar o cron

Pressione **Ctrl+C** para encerrar o cron:

```
^C
🛑 Encerrando cron local...
✅ Cron encerrado. Até logo!
```

## 📋 Scripts Disponíveis

### `set-rodada4-end-today.js`
- Define a Rodada 4 para terminar hoje às 19:30
- Se já passou das 19:30, define para amanhã

### `local-cron.js`
- Verifica a cada 1 minuto se há competições para finalizar
- Executa automaticamente o `snapshot-final.js` quando chega a hora
- Mostra tempo restante até a próxima finalização

### `snapshot-final.js` (manual)
- Finaliza uma competição específica manualmente
- Uso: `node scripts/snapshot-final.js <competitionId>`

## 🎯 Dicas

1. **Deixe o cron rodando** em um terminal separado
2. **Não feche o terminal** até a rodada finalizar
3. **Monitore os logs** para ver quando a finalização acontecer
4. **Em produção**, o Vercel faz isso automaticamente via cron jobs configurados em `vercel.json`

## ⚠️ Observações

- O cron usa o horário de **Brasília** (America/Sao_Paulo)
- Verifica **a cada 1 minuto** (pode ser ajustado no código)
- Executa o mesmo script que o Vercel usa em produção
- Ideal para testes locais antes de fazer deploy

## 🔧 Configuração Avançada

Para mudar a frequência de verificação, edite o arquivo `local-cron.js` na linha:

```javascript
// A cada 1 minuto
cron.schedule('*/1 * * * *', async () => {

// Para a cada 30 segundos:
cron.schedule('*/30 * * * * *', async () => {

// Para a cada 5 minutos:
cron.schedule('*/5 * * * *', async () => {
```

Formato cron: `minuto hora dia mês dia-da-semana`
- `*/1` = a cada 1 minuto
- `*/5` = a cada 5 minutos
- `0 * * * *` = no minuto 0 de cada hora
- `0 0 * * *` = todo dia à meia-noite
