const { Connection, PublicKey, SystemProgram, Transaction, Keypair, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');

async function fundVault() {
  try {
    console.log('💰 Adicionando SOL ao Vault do Programa...\n');

    // Conectar à devnet
    const connection = new Connection('https://devnet.helius-rpc.com/?api-key=0ef6f1af-3077-456d-8df0-21e8b74a9382', 'confirmed');

    // Program ID
    const programId = new PublicKey('6tLh1Lk5kXuELgCfAH7Z7T6VYEUxYJZkQU5WYYHcJNHW');

    // Derivar o endereço da treasury/vault
    const [vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('mfl-vault')],
      programId
    );

    console.log(`📍 Vault PDA: ${vaultPDA.toBase58()}`);

    // Carregar a keypair do usuário
    const keypairPath = 'C:\\Users\\preti\\.config\\solana\\id.json';
    const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
    const payer = Keypair.fromSecretKey(Uint8Array.from(secretKey));

    console.log(`👤 Pagador: ${payer.publicKey.toBase58()}`);

    // Verificar saldo do pagador
    const payerBalance = await connection.getBalance(payer.publicKey);
    console.log(`💳 Saldo do pagador: ${(payerBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

    if (payerBalance < 2 * LAMPORTS_PER_SOL) {
      console.log('\n⚠️ Saldo insuficiente! Você precisa de pelo menos 2 SOL na devnet.');
      console.log('🚰 Use: solana airdrop 2');
      return;
    }

    // Quantidade a adicionar (1 SOL = 1,000,000,000 lamports)
    const amountToAdd = 1 * LAMPORTS_PER_SOL;
    console.log(`\n💸 Valor a adicionar: ${(amountToAdd / LAMPORTS_PER_SOL).toFixed(4)} SOL (${amountToAdd} lamports)`);

    // Criar a transação
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: vaultPDA,
        lamports: amountToAdd,
      })
    );

    // Enviar e confirmar transação
    console.log('\n📤 Enviando transação...');
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
      {
        commitment: 'confirmed',
      }
    );

    console.log('✅ Transação confirmada!');
    console.log(`📝 Signature: ${signature}`);

    // Verificar novo saldo
    const newBalance = await connection.getBalance(vaultPDA);
    console.log(`\n💰 Novo saldo do Vault: ${(newBalance / LAMPORTS_PER_SOL).toFixed(9)} SOL (${newBalance} lamports)`);

    console.log('\n✅ Vault financiado com sucesso! Agora você pode testar os claims onchain.');

  } catch (error) {
    console.error('❌ Erro ao financiar vault:', error.message);
    if (error.logs) {
      console.error('Logs:', error.logs);
    }
  }
}

fundVault();
