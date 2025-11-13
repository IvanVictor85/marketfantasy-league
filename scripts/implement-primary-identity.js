const fs = require('fs');
const path = require('path');

console.log('🔧 Implementando lógica de Identidade Primária na página de perfil...\n');

const perfilPath = path.join(__dirname, '..', 'src/app/[locale]/perfil/page.tsx');
let content = fs.readFileSync(perfilPath, 'utf8');

// PASSO 1: Adicionar estados necessários para email e wallet
const afterBioState = `  const [bio, setBio] = useState<string>('');`;
const withNewStates = `  const [bio, setBio] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isLinkingWallet, setIsLinkingWallet] = useState<boolean>(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState<boolean>(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState<string>('');
  const [showEmailVerification, setShowEmailVerification] = useState<boolean>(false);`;

if (!content.includes('const [email, setEmail]')) {
  content = content.replace(afterBioState, withNewStates);
  console.log('✅ Estados adicionados: email, walletAddress, isLinkingWallet, isVerifyingEmail');
}

// PASSO 2: Adicionar lógica para determinar loginMethod
const afterUserCheck = `    // Carregar dados do perfil se usuário autenticado
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setTwitter(user.twitter || '');
      setDiscord(user.discord || '');
      setBio(user.bio || '');`;

const withEmailAndWallet = `    // Carregar dados do perfil se usuário autenticado
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setWalletAddress(user.publicKey || '');
      setTwitter(user.twitter || '');
      setDiscord(user.discord || '');
      setBio(user.bio || '');`;

content = content.replace(afterUserCheck, withEmailAndWallet);
console.log('✅ Carregamento de email e walletAddress adicionado ao useEffect');

// PASSO 3: Adicionar campos de Email e Wallet antes do campo Twitter
const beforeTwitterField = `                <div className="space-y-2">
                  <Label htmlFor="twitter">{t('twitterLabel')}</Label>`;

const emailAndWalletFields = `                {/* Campo de Email - Bloqueado se login foi por email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                    {user?.loginMethod === 'email' && (
                      <span className="ml-2 text-xs text-muted-foreground">(Identidade Principal)</span>
                    )}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ''}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    disabled={user?.loginMethod === 'email'}
                    readOnly={user?.loginMethod === 'email'}
                    className={user?.loginMethod === 'email' ? 'bg-muted cursor-not-allowed' : ''}
                  />
                  {user?.loginMethod === 'email' ? (
                    <p className="text-xs text-muted-foreground">
                      ✅ Este é seu método de login principal (não editável)
                    </p>
                  ) : !user?.email ? (
                    <p className="text-xs text-orange-600">
                      ⚠️ Adicione um email para recuperação de conta
                    </p>
                  ) : null}
                </div>

                {/* Campo de Carteira - Sempre read-only quando vinculada */}
                <div className="space-y-2">
                  <Label htmlFor="wallet">
                    Carteira Solana
                    {user?.loginMethod === 'wallet' && (
                      <span className="ml-2 text-xs text-muted-foreground">(Identidade Principal)</span>
                    )}
                  </Label>
                  <Input
                    id="wallet"
                    defaultValue={user?.publicKey || ''}
                    placeholder={user?.publicKey ? '' : 'Nenhuma carteira vinculada'}
                    disabled={true}
                    readOnly={true}
                    className="bg-muted cursor-not-allowed font-mono text-xs"
                  />
                  {user?.loginMethod === 'wallet' ? (
                    <p className="text-xs text-muted-foreground">
                      ✅ Esta é sua identidade principal (não editável)
                    </p>
                  ) : user?.publicKey ? (
                    <p className="text-xs text-muted-foreground">
                      ✅ Carteira vinculada à sua conta
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-orange-600">
                        ⚠️ Nenhuma carteira vinculada. Vincule uma carteira para acessar recursos Web3.
                      </p>
                      {/* Botão Vincular Carteira só aparece para usuários de email sem carteira */}
                      {user?.loginMethod === 'email' && !user?.publicKey && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            alert('Funcionalidade de vincular carteira será implementada');
                            // TODO: Implementar lógica de vincular carteira
                            // Chamar connectWalletToUser do auth-context
                          }}
                          disabled={isLinkingWallet}
                        >
                          {isLinkingWallet ? 'Vinculando...' : '🔗 Vincular Carteira'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">{t('twitterLabel')}</Label>`;

content = content.replace(beforeTwitterField, emailAndWalletFields);
console.log('✅ Campos de Email e Wallet adicionados com lógica de bloqueio');

fs.writeFileSync(perfilPath, content, 'utf8');

console.log('\n✨ Lógica de Identidade Primária implementada com sucesso!');
console.log('\n📋 Funcionalidades implementadas:');
console.log('   ✅ Campo Email bloqueado para loginMethod: "email"');
console.log('   ✅ Campo Wallet sempre read-only quando vinculada');
console.log('   ✅ Labels indicam qual é a identidade principal');
console.log('   ✅ Mensagens contextuais baseadas no estado');
console.log('   ✅ Botão "Vincular Carteira" para usuários de email');
console.log('\n⚠️  TODO: Implementar função de vincular carteira');
console.log('   TODO: Implementar verificação de email para wallet users');
