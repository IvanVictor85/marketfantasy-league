const fs = require('fs');
const path = require('path');

console.log('🔧 Adicionando verificação de email para usuários de carteira...\n');

const perfilPath = path.join(__dirname, '..', 'src/app/[locale]/perfil/page.tsx');
let content = fs.readFileSync(perfilPath, 'utf8');

// PASSO 1: Adicionar sendVerificationCode ao destructuring de useAuth
const oldAuth = `  const { user, updateUserProfile, isAuthenticated, isLoading, connectWalletToUser } = useAuth();`;
const newAuth = `  const { user, updateUserProfile, isAuthenticated, isLoading, connectWalletToUser, sendVerificationCode, verifyCodeAndLogin } = useAuth();`;

content = content.replace(oldAuth, newAuth);
console.log('✅ sendVerificationCode e verifyCodeAndLogin adicionados ao useAuth');

// PASSO 2: Adicionar função handleSendEmailVerification antes de handleSubmit
const beforeHandleSubmit = `  // Função para vincular carteira (usuários que logaram com email)
  const handleLinkWallet`;

const emailVerificationFunctions = `  // Função para enviar código de verificação de email (usuários de carteira)
  const handleSendEmailVerification = async () => {
    if (!email || !email.includes('@')) {
      alert('Por favor, digite um email válido.');
      return;
    }

    if (user?.loginMethod !== 'wallet') {
      alert('Esta função é apenas para usuários que fizeram login com carteira.');
      return;
    }

    try {
      setIsVerifyingEmail(true);
      console.log('[PERFIL] Enviando código de verificação para:', email);

      const result = await sendVerificationCode(email);

      setShowEmailVerification(true);
      alert(\`Código de verificação enviado para \${email}. Verifique sua caixa de entrada.\`);

      // Em desenvolvimento, mostrar o código no console
      if (result.developmentCode) {
        console.log('🔑 [DEV] Código de verificação:', result.developmentCode);
      }
    } catch (error: any) {
      console.error('[PERFIL] Erro ao enviar código:', error);
      alert(\`Erro ao enviar código: \${error.message || 'Erro desconhecido'}\`);
      setIsVerifyingEmail(false);
    }
  };

  // Função para verificar código e vincular email
  const handleVerifyEmail = async () => {
    if (!email || !emailVerificationCode) {
      alert('Por favor, preencha o email e o código de verificação.');
      return;
    }

    try {
      setIsVerifyingEmail(true);
      console.log('[PERFIL] Verificando código...');

      // Chamar a API diretamente para vincular email à conta de carteira
      const response = await fetch('/api/user/link-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: email,
          code: emailVerificationCode
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao verificar código');
      }

      console.log('[PERFIL] Email verificado e vinculado com sucesso!');

      // Atualizar user no contexto
      await updateUserProfile({ email });

      setShowEmailVerification(false);
      setEmailVerificationCode('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);

      alert('Email verificado e vinculado com sucesso!');
    } catch (error: any) {
      console.error('[PERFIL] Erro ao verificar código:', error);
      alert(\`Erro ao verificar código: \${error.message || 'Código inválido'}\`);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Função para vincular carteira (usuários que logaram com email)
  const handleLinkWallet`;

content = content.replace(beforeHandleSubmit, emailVerificationFunctions);
console.log('✅ Funções de verificação de email adicionadas');

// PASSO 3: Modificar o campo de email para adicionar botão de verificação para wallet users
const emailFieldEnd = `                  {user?.loginMethod === 'email' ? (
                    <p className="text-xs text-muted-foreground">
                      ✅ Este é seu método de login principal (não editável)
                    </p>
                  ) : !user?.email ? (
                    <p className="text-xs text-orange-600">
                      ⚠️ Adicione um email para recuperação de conta
                    </p>
                  ) : null}
                </div>`;

const emailFieldWithVerification = `                  {user?.loginMethod === 'email' ? (
                    <p className="text-xs text-muted-foreground">
                      ✅ Este é seu método de login principal (não editável)
                    </p>
                  ) : !user?.email ? (
                    <div className="space-y-2">
                      <p className="text-xs text-orange-600">
                        ⚠️ Adicione um email para recuperação de conta
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSendEmailVerification}
                        disabled={isVerifyingEmail || !email}
                      >
                        {isVerifyingEmail ? 'Enviando...' : '📧 Enviar Código de Verificação'}
                      </Button>

                      {/* Campo de verificação de código */}
                      {showEmailVerification && (
                        <div className="space-y-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                          <Label htmlFor="verification-code" className="text-sm">
                            Digite o código enviado para {email}
                          </Label>
                          <Input
                            id="verification-code"
                            type="text"
                            placeholder="123456"
                            value={emailVerificationCode}
                            onChange={(e) => setEmailVerificationCode(e.target.value)}
                            maxLength={6}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleVerifyEmail}
                            disabled={isVerifyingEmail || !emailVerificationCode}
                            className="w-full"
                          >
                            {isVerifyingEmail ? 'Verificando...' : '✅ Verificar Código'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      ✅ Email verificado e vinculado à sua conta
                    </p>
                  )}
                </div>`;

content = content.replace(emailFieldEnd, emailFieldWithVerification);
console.log('✅ UI de verificação de email adicionada ao campo de email');

fs.writeFileSync(perfilPath, content, 'utf8');

console.log('\n✨ Verificação de email implementada!');
console.log('\n📋 Funcionalidade:');
console.log('   1. Usuários de carteira podem adicionar email');
console.log('   2. Botão "Enviar Código de Verificação" envia código por email');
console.log('   3. Campo de verificação aparece após enviar código');
console.log('   4. Código é verificado e email vinculado à conta');
console.log('\n⚠️  Nota: Necessário criar API route /api/user/link-email');
