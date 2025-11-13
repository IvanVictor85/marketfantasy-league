const fs = require('fs');
const path = require('path');

console.log('🔧 Adicionando campos de Email e Wallet ao formulário de perfil...\n');

const perfilPath = path.join(__dirname, '..', 'src/app/[locale]/perfil/page.tsx');
let content = fs.readFileSync(perfilPath, 'utf8');

// Adicionar campos de Email e Wallet ANTES do campo Twitter
const beforeTwitter = `                <div className="space-y-2">
                  <Label htmlFor="twitter">`;

const emailAndWalletFields = `                {/* ===== CAMPOS DE IDENTIDADE ===== */}

                {/* Campo de Email - Bloqueado se login foi por email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    📧 Email
                    {user?.loginMethod === 'email' && (
                      <span className="ml-2 text-xs font-semibold text-green-600">
                        (Identidade Principal)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    disabled={user?.loginMethod === 'email'}
                    readOnly={user?.loginMethod === 'email'}
                    className={user?.loginMethod === 'email' ? 'bg-muted cursor-not-allowed' : ''}
                  />
                  {user?.loginMethod === 'email' ? (
                    <p className="text-xs text-green-600">
                      ✅ Este é seu método de login principal (não editável)
                    </p>
                  ) : !user?.email ? (
                    <div className="space-y-2">
                      <p className="text-xs text-orange-600">
                        ⚠️ Adicione um email para recuperação de conta e notificações
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSendEmailVerification}
                        disabled={isVerifyingEmail || !email || !email.includes('@')}
                      >
                        {isVerifyingEmail ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>📧 Enviar Código de Verificação</>
                        )}
                      </Button>

                      {/* Campo de verificação de código */}
                      {showEmailVerification && (
                        <div className="space-y-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                          <Label htmlFor="verification-code" className="text-sm font-semibold">
                            Digite o código enviado para {email}
                          </Label>
                          <Input
                            id="verification-code"
                            type="text"
                            placeholder="123456"
                            value={emailVerificationCode}
                            onChange={(e) => setEmailVerificationCode(e.target.value)}
                            maxLength={6}
                            className="font-mono text-center text-lg"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleVerifyEmail}
                            disabled={isVerifyingEmail || !emailVerificationCode || emailVerificationCode.length !== 6}
                            className="w-full"
                          >
                            {isVerifyingEmail ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verificando...
                              </>
                            ) : (
                              <>✅ Verificar Código</>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-green-600">
                      ✅ Email verificado e vinculado à sua conta
                    </p>
                  )}
                </div>

                {/* Campo de Carteira - Sempre read-only quando vinculada */}
                <div className="space-y-2">
                  <Label htmlFor="wallet">
                    👛 Carteira Solana
                    {user?.loginMethod === 'wallet' && (
                      <span className="ml-2 text-xs font-semibold text-purple-600">
                        (Identidade Principal)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="wallet"
                    value={walletAddress}
                    placeholder={user?.publicKey ? '' : 'Nenhuma carteira vinculada'}
                    disabled={true}
                    readOnly={true}
                    className="bg-muted cursor-not-allowed font-mono text-xs"
                  />
                  {user?.loginMethod === 'wallet' ? (
                    <p className="text-xs text-purple-600">
                      ✅ Esta é sua identidade principal (não editável)
                    </p>
                  ) : user?.publicKey ? (
                    <p className="text-xs text-green-600">
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
                          onClick={handleLinkWallet}
                          disabled={isLinkingWallet || !wallet.connected}
                        >
                          {isLinkingWallet ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Vinculando...
                            </>
                          ) : !wallet.connected ? (
                            <>⚠️ Conecte sua Carteira Primeiro</>
                          ) : (
                            <>🔗 Vincular Carteira (SIWS)</>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* ===== FIM DOS CAMPOS DE IDENTIDADE ===== */}

                <div className="space-y-2">
                  <Label htmlFor="twitter">`;

if (!content.includes('CAMPOS DE IDENTIDADE')) {
  content = content.replace(beforeTwitter, emailAndWalletFields);
  console.log('✅ Campos de Email e Wallet adicionados ao formulário');
} else {
  console.log('⚠️ Campos já existem no formulário');
}

fs.writeFileSync(perfilPath, content, 'utf8');

console.log('\n✨ Campos de identidade implementados!');
console.log('\n📋 Campos adicionados:');
console.log('   📧 Email - Bloqueado para loginMethod: "email"');
console.log('   👛 Wallet - Sempre read-only');
console.log('   🔗 Botão Vincular Carteira (email users)');
console.log('   📧 Botão Enviar Código (wallet users)');
console.log('   ✅ Campo de verificação de código');
