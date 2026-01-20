const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { AnchorProvider, Program } = require('@coral-xyz/anchor');

async function checkVaultBalance() {
  try {
    // Conectar à devnet
    const connection = new Connection('https://devnet.helius-rpc.com/?api-key=0ef6f1af-3077-456d-8df0-21e8b74a9382', 'confirmed');

    // Program ID do programa deployado
    const programId = new PublicKey('6tLh1Lk5kXuELgCfAH7Z7T6VYEUxYJZkQU5WYYHcJNHW');

    // Derivar o endereço da treasury/vault
    const [vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('mfl-vault')],
      programId
    );

    console.log('🔍 Verificando saldo do Vault (Treasury)...\n');
    console.log(`📍 Endereço do Vault PDA: ${vaultPDA.toBase58()}`);

    // Verificar saldo
    const balance = await connection.getBalance(vaultPDA);
    const balanceSOL = balance / LAMPORTS_PER_SOL;

    console.log(`\n💰 Saldo do Vault: ${balanceSOL.toFixed(9)} SOL (${balance} lamports)`);

    if (balanceSOL === 0) {
      console.log('\n⚠️  ATENÇÃO: Vault está vazio!');
      console.log('   Para adicionar fundos, use o script de adicionar SOL ao vault.');
    } else if (balanceSOL < 1) {
      console.log('\n⚠️  Vault tem poucos fundos. Considere adicionar mais SOL.');
    } else {
      console.log('\n✅ Vault tem fundos suficientes para testes!');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar saldo do vault:', error.message);
  }
}

checkVaultBalance();
