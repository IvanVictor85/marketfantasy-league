const fs = require('fs');
const path = require('path');

console.log('🔧 Refatoração Global - Tipos e Perfil\n');

// ============================================================
// PASSO 1: PADRONIZAR Player em teams.ts
// ============================================================
console.log('📋 PASSO 1: Padronizando tipo Player...');
const teamsTypesPath = path.join(__dirname, '..', 'src/types/teams.ts');
let teamsContent = fs.readFileSync(teamsTypesPath, 'utf8');

const oldPlayerInterface = `export interface Player {
  id: string;
  position: number; // 1-10 (1 = goalkeeper, 2-5 = defenders, 6-8 = midfielders, 9-10 = forwards)
  name: string;
  symbol: string; // ✅ Campo padronizado (novo)
  token?: string; // Mantido para compatibilidade (antigo)
  image?: string;
  // Campos padronizados (novos)
  currentPrice?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  marketCap?: number;
  totalVolume?: number;
  marketCapRank?: number | null;
  // Campos antigos (mantidos para compatibilidade)
  price: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  change_24h?: number;
  change_7d?: number;
}`;

const newPlayerInterface = `export interface Player {
  id: string;
  position: number; // 1-10 (1 = goalkeeper, 2-5 = defenders, 6-8 = midfielders, 9-10 = forwards)
  name: string;
  symbol: string; // ✅ Símbolo do token (ex: BTC, ETH, SOL)
  image: string;
  // Campos de preço e mercado (padronizados)
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number;
  marketCapRank: number | null;
  // Campos do jogo
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}`;

teamsContent = teamsContent.replace(oldPlayerInterface, newPlayerInterface);
fs.writeFileSync(teamsTypesPath, teamsContent, 'utf8');
console.log('✅ Tipo Player padronizado (removidos campos antigos: token, price, change_24h, change_7d)');

// ============================================================
// PASSO 2: VERIFICAR User em auth.ts (já está correto)
// ============================================================
console.log('\n📋 PASSO 2: Verificando tipo User...');
const authTypesPath = path.join(__dirname, '..', 'src/types/auth.ts');
const authContent = fs.readFileSync(authTypesPath, 'utf8');

if (authContent.includes('username?: string;') && authContent.includes('email?: string;')) {
  console.log('✅ Tipo User já tem username e email como string | null');
} else {
  console.log('⚠️ Tipo User precisa de ajustes manuais');
}

// ============================================================
// PASSO 3: READICIONAR CAMPOS EMAIL E CARTEIRA EM PERFIL
// ============================================================
console.log('\n📋 PASSO 3: Readicionando campos Email e Carteira em perfil/page.tsx...');
const perfilPath = path.join(__dirname, '..', 'src/app/[locale]/perfil/page.tsx');
let perfilContent = fs.readFileSync(perfilPath, 'utf8');

// Verificar se os campos já existem
if (perfilContent.includes('CAMPOS DE IDENTIDADE')) {
  console.log('⚠️ Campos de Email e Carteira já existem no formulário');
} else {
  // Inserir antes do campo Twitter
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

  perfilContent = perfilContent.replace(beforeTwitter, emailAndWalletFields);
  fs.writeFileSync(perfilPath, perfilContent, 'utf8');
  console.log('✅ Campos Email e Carteira readicionados ao formulário de perfil');
}

console.log('\n✨ Refatoração concluída!');
console.log('\n📋 Próximos passos:');
console.log('   1. Corrigir dashboard/page.tsx (linha ~1042) para usar os novos campos');
console.log('   2. Fazer varredura final de player.token e player.price');
