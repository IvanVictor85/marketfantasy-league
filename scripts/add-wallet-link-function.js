const fs = require('fs');
const path = require('path');

console.log('🔧 Adicionando função de vincular carteira...\n');

const perfilPath = path.join(__dirname, '..', 'src/app/[locale]/perfil/page.tsx');
let content = fs.readFileSync(perfilPath, 'utf8');

// PASSO 1: Importar useWallet
const imports = `import { useTranslations } from 'next-intl';`;
const withWalletImport = `import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';`;

if (!content.includes('useWallet')) {
  content = content.replace(imports, withWalletImport);
  console.log('✅ Import do useWallet adicionado');
}

// PASSO 2: Adicionar hook useWallet e connectWalletToUser do auth
const afterUseAuth = `  const { user, updateUserProfile, isAuthenticated, isLoading } = useAuth();`;
const withWalletHook = `  const { user, updateUserProfile, isAuthenticated, isLoading, connectWalletToUser } = useAuth();
  const wallet = useWallet();`;

if (!content.includes('const wallet = useWallet()')) {
  content = content.replace(afterUseAuth, withWalletHook);
  console.log('✅ Hook useWallet e connectWalletToUser adicionados');
}

// PASSO 3: Adicionar função handleLinkWallet antes do handleSubmit
const beforeHandleSubmit = `  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {`;

const linkWalletFunction = `  // Função para vincular carteira (usuários que logaram com email)
  const handleLinkWallet = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      alert('Por favor, conecte sua carteira primeiro usando o botão no canto superior direito.');
      return;
    }

    if (user?.loginMethod !== 'email') {
      alert('Esta função é apenas para usuários que fizeram login com email.');
      return;
    }

    try {
      setIsLinkingWallet(true);
      console.log('[PERFIL] Iniciando vinculação de carteira...');

      // Chamar a função connectWalletToUser do auth-context
      // Ela implementa o fluxo SIWS completo
      await connectWalletToUser();

      console.log('[PERFIL] Carteira vinculada com sucesso!');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error: any) {
      console.error('[PERFIL] Erro ao vincular carteira:', error);
      alert(\`Erro ao vincular carteira: \${error.message || 'Erro desconhecido'}\`);
    } finally {
      setIsLinkingWallet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {`;

if (!content.includes('handleLinkWallet')) {
  content = content.replace(beforeHandleSubmit, linkWalletFunction);
  console.log('✅ Função handleLinkWallet adicionada');
}

// PASSO 4: Substituir o alert pelo handleLinkWallet no botão
const alertButton = `                          onClick={() => {
                            alert('Funcionalidade de vincular carteira será implementada');
                            // TODO: Implementar lógica de vincular carteira
                            // Chamar connectWalletToUser do auth-context
                          }}`;

const realButton = `                          onClick={handleLinkWallet}`;

content = content.replace(alertButton, realButton);
console.log('✅ Botão "Vincular Carteira" conectado à função handleLinkWallet');

fs.writeFileSync(perfilPath, content, 'utf8');

console.log('\n✨ Função de vincular carteira implementada!');
console.log('\n📋 Funcionalidade:');
console.log('   1. Verifica se carteira está conectada');
console.log('   2. Valida que usuário logou com email');
console.log('   3. Chama connectWalletToUser (SIWS completo)');
console.log('   4. Atualiza UI com feedback');
