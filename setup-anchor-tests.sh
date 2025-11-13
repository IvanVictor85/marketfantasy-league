#!/bin/bash

echo "🚀 Instalando dependências para testes do Anchor..."
echo ""

# Instalar dependências TypeScript para testes
npm install --save-dev \
  @coral-xyz/anchor \
  @solana/web3.js \
  chai \
  mocha \
  ts-mocha \
  @types/mocha \
  @types/chai

echo ""
echo "✅ Dependências instaladas com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Instalar Anchor CLI (se ainda não tiver):"
echo "   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
echo "   avm install latest"
echo "   avm use latest"
echo ""
echo "2. Gerar Program ID:"
echo "   anchor keys list"
echo ""
echo "3. Atualizar declare_id! em programs/cryptofantasy/src/lib.rs"
echo ""
echo "4. Build e testar:"
echo "   anchor build"
echo "   anchor test"
echo ""
