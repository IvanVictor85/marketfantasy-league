const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAuth() {
  console.log('🔍 Debugando problema de autenticação...\n');

  try {
    // 1. Verificar usuários no banco
    console.log('1️⃣ Verificando usuários no banco:');
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        email: true,
        username: true,
        publicKey: true,
        name: true
      }
    });

    if (users.length === 0) {
      console.log('   ❌ NENHUM USUÁRIO ENCONTRADO NO BANCO!');
      return;
    }

    users.forEach(u => {
      console.log(`   ✅ ${u.email || u.username || u.name}`);
      console.log(`      ID: ${u.id}`);
      console.log(`      Name: ${u.name || 'N/A'}`);
      console.log(`      Wallet: ${u.publicKey || 'Não vinculada'}`);
    });

    // 2. Verificar AuthTokens
    console.log('\n2️⃣ Verificando tokens de autenticação:');
    const authTokens = await prisma.authToken.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        token: true,
        expiresAt: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            username: true
          }
        }
      }
    });

    if (authTokens.length === 0) {
      console.log('   ⚠️  NENHUM TOKEN DE AUTENTICAÇÃO ENCONTRADO!');
      console.log('   → Usuários precisam fazer login novamente');
    } else {
      const now = new Date();
      authTokens.forEach(token => {
        const isExpired = new Date(token.expiresAt) < now;
        const username = token.user.username || token.user.email;
        console.log(`   ${isExpired ? '❌' : '✅'} ${username}`);
        console.log(`      Token: ${token.token.substring(0, 20)}...`);
        console.log(`      Expira: ${token.expiresAt}`);
        console.log(`      Status: ${isExpired ? '🔴 EXPIRADO' : '🟢 VÁLIDO'}`);
      });
    }

    // 3. Verificar times existentes
    console.log('\n3️⃣ Verificando times no banco:');
    const teams = await prisma.userTeam.findMany({
      take: 5,
      include: {
        user: {
          select: {
            email: true,
            username: true
          }
        },
        competition: {
          select: {
            name: true,
            status: true
          }
        }
      }
    });

    if (teams.length === 0) {
      console.log('   ⚠️  NENHUM TIME ENCONTRADO!');
    } else {
      teams.forEach(team => {
        const username = team.user.username || team.user.email;
        console.log(`   ✅ ${username} - ${team.competition.name}`);
        console.log(`      Status: ${team.competition.status}`);
        console.log(`      Tokens escalados: ${team.tokens ? JSON.parse(team.tokens).length : 0}`);
      });
    }

    console.log('\n📋 DIAGNÓSTICO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (authTokens.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Nenhum token de autenticação válido');
      console.log('');
      console.log('SOLUÇÃO:');
      console.log('  1. Faça logout no navegador');
      console.log('  2. Limpe os cookies (F12 > Application > Cookies)');
      console.log('  3. Faça login novamente');
      console.log('  4. Se o problema persistir, limpe o localStorage também');
    } else {
      const validTokens = authTokens.filter(t => new Date(t.expiresAt) > new Date());
      if (validTokens.length === 0) {
        console.log('❌ PROBLEMA: Todos os tokens estão EXPIRADOS');
        console.log('');
        console.log('SOLUÇÃO:');
        console.log('  1. Faça login novamente para gerar um novo token');
      } else {
        console.log(`✅ ${validTokens.length} token(s) válido(s) encontrado(s)`);
        console.log('');
        console.log('Se ainda houver erro 401:');
        console.log('  1. Verifique se o token está sendo enviado nos headers');
        console.log('  2. Verifique se o formato é: Authorization: Bearer <token>');
        console.log('  3. Limpe cookies e localStorage e faça login novamente');
      }
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();
