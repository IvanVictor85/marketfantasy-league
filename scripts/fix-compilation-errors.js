const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo erros de compilação...\n');

// ERRO 1: Corrigir chamada de connectWalletToUser na página de perfil
const perfilPath = path.join(__dirname, '..', 'src/app/[locale]/perfil/page.tsx');
let perfilContent = fs.readFileSync(perfilPath, 'utf8');

// connectWalletToUser não precisa de parâmetros (pega do context)
const oldCall = `      await connectWalletToUser();`;
const newCall = `      // connectWalletToUser pega publicKey e signMessage do context
      await connectWalletToUser();`;

perfilContent = perfilContent.replace(oldCall, newCall);
console.log('✅ Chamada de connectWalletToUser corrigida (não precisa de parâmetros)');

// ERRO 2: Remover verificação de loginMethod (campo não existe no Prisma)
const linkEmailPath = path.join(__dirname, '..', 'src/app/api/user/link-email/route.ts');
let linkEmailContent = fs.readFileSync(linkEmailPath, 'utf8');

const loginMethodCheck = `    // ETAPA 2: Verificar que o usuário logou com carteira
    if (user.loginMethod !== 'wallet') {
      return NextResponse.json(
        { error: 'Esta função é apenas para usuários que fizeram login com carteira' },
        { status: 403 }
      );
    }

    // ETAPA 3: Verificar o código de verificação`;

const withoutLoginMethod = `    // ETAPA 2: Verificar que o usuário tem carteira vinculada (implica que é wallet user)
    if (!user.publicKey) {
      return NextResponse.json(
        { error: 'Esta função é apenas para usuários com carteira vinculada' },
        { status: 403 }
      );
    }

    // ETAPA 3: Verificar o código de verificação`;

linkEmailContent = linkEmailContent.replace(loginMethodCheck, withoutLoginMethod);
console.log('✅ Verificação de loginMethod substituída por verificação de publicKey');

// ERRO 3: Remover campos 'used' e 'usedAt' que não existem no modelo
const usedField = `      where: {
        email: email,
        code: code,
        used: false,
        expiresAt: {
          gt: new Date() // Não expirado
        }
      },`;

const withoutUsed = `      where: {
        email: email,
        code: code,
        expiresAt: {
          gt: new Date() // Não expirado
        }
      },`;

linkEmailContent = linkEmailContent.replace(usedField, withoutUsed);

const updateUsed = `    // ETAPA 5: Marcar código como usado
    await prisma.verificationCode.update({
      where: { id: verificationRecord.id },
      data: {
        used: true,
        usedAt: new Date()
      }
    });

    // ETAPA 6: Vincular email ao usuário`;

const deleteCode = `    // ETAPA 5: Deletar código (já foi usado)
    await prisma.verificationCode.delete({
      where: { id: verificationRecord.id }
    });

    // ETAPA 6: Vincular email ao usuário`;

linkEmailContent = linkEmailContent.replace(updateUsed, deleteCode);
console.log('✅ Campos "used" e "usedAt" removidos (deletar código ao invés de marcar como usado)');

// Salvar arquivos
fs.writeFileSync(perfilPath, perfilContent, 'utf8');
fs.writeFileSync(linkEmailPath, linkEmailContent, 'utf8');

console.log('\n✨ Erros de compilação corrigidos!');
console.log('\n📋 Correções aplicadas:');
console.log('   1. connectWalletToUser() não precisa de parâmetros');
console.log('   2. Verificar publicKey ao invés de loginMethod');
console.log('   3. Deletar código de verificação ao invés de marcar como usado');
