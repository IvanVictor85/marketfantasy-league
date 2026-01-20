const { Connection, PublicKey } = require('@solana/web3.js');

// Load environment variables
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

async function checkVaultStatus() {
  try {
    console.log('🔍 Verificando status do vault no programa Solana...\n');

    const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || '7QHMrTeoLTggAy11kTTEwtoRzcvK8rEeY1TRu4oUdgGP');
    const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=0ef6f1af-3077-456d-8df0-21e8b74a9382';

    console.log(`📋 Program ID: ${PROGRAM_ID.toString()}`);
    console.log(`🌐 RPC URL: ${RPC_URL}\n`);

    // Connect to Solana
    const connection = new Connection(RPC_URL, 'confirmed');

    // Derive the vault PDA (same seed as in the smart contract)
    const [vaultPda, vaultBump] = await PublicKey.findProgramAddress(
      [Buffer.from('mfl-vault')],
      PROGRAM_ID
    );

    console.log(`🏦 Vault PDA: ${vaultPda.toString()}`);
    console.log(`   Bump: ${vaultBump}\n`);

    // Check if vault account exists
    const vaultInfo = await connection.getAccountInfo(vaultPda);

    if (!vaultInfo) {
      console.log('❌ VAULT NÃO INICIALIZADO!');
      console.log('   O vault não existe na blockchain.');
      console.log('   Você precisa executar: anchor run initialize-vault\n');
      console.log('💡 Solução:');
      console.log('   1. Execute: anchor run initialize-vault');
      console.log('   2. Ou crie um script para inicializar o vault');
      return false;
    }

    console.log('✅ VAULT INICIALIZADO!');
    console.log(`   Owner: ${vaultInfo.owner.toString()}`);
    console.log(`   Tamanho dos dados: ${vaultInfo.data.length} bytes`);
    console.log(`   Lamports: ${vaultInfo.lamports / 1e9} SOL`);
    console.log(`   Executable: ${vaultInfo.executable}`);

    // Try to deserialize vault data (if you know the structure)
    // The vault should have: authority (32 bytes) + total_pot (8 bytes)
    if (vaultInfo.data.length >= 40) {
      const authority = new PublicKey(vaultInfo.data.slice(8, 40)); // Skip discriminator
      const totalPot = vaultInfo.data.readBigUInt64LE(40);

      console.log(`\n📊 Dados do Vault:`);
      console.log(`   Authority: ${authority.toString()}`);
      console.log(`   Total Pot: ${Number(totalPot) / 1e9} SOL`);
    }

    return true;

  } catch (error) {
    console.error('\n❌ Erro ao verificar vault:', error.message);
    return false;
  }
}

checkVaultStatus().then(success => {
  process.exit(success ? 0 : 1);
});
