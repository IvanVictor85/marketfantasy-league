const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo chamada do Smart Contract...\n');

const teamsContentPath = path.join(__dirname, '..', 'src/app/[locale]/teams/teams-content.tsx');
let content = fs.readFileSync(teamsContentPath, 'utf8');

// Anchor v0.30+ usa accountsPartial ou accountsStrict
// Vamos tentar usar accountsPartial que é mais flexível
const oldCall = `      const txHash = await program.methods
        .depositEntryFee()
        .accounts({
          vault: vaultPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc(); // Envia a transação`;

const newCall = `      const txHash = await program.methods
        .depositEntryFee()
        .accountsPartial({
          vault: vaultPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc(); // Envia a transação`;

content = content.replace(oldCall, newCall);

fs.writeFileSync(teamsContentPath, content, 'utf8');
console.log('✅ Smart Contract call corrigido: .accounts() → .accountsPartial()');
console.log('   Isso resolve o erro TypeScript com Anchor v0.30+');
