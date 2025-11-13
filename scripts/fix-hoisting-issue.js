const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'contexts', 'auth-context.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find and remove the connectWalletToUser function from its current location (after loginWithGoogle)
const connectWalletRegex = /  \/\/ Conecta carteira a um usuário já logado por email\n  \/\/ Conecta e VERIFICA \(SIWS\) uma carteira a um usuário já logado por email\n  const connectWalletToUser = useCallback\(async \(\) => \{[\s\S]*?\n  \}, \[user, publicKey, signMessage, setIsLoading, setUser\]\);\n\n/;

const connectWalletFunction = content.match(connectWalletRegex);

if (!connectWalletFunction) {
  console.error('❌ Não foi possível encontrar a função connectWalletToUser');
  process.exit(1);
}

// Remove it from current location
content = content.replace(connectWalletRegex, '');

// Insert it right after loginWithWallet (after line with "}, [publicKey, signMessage, setIsLoading, setUser]); // Dependências corretas")
const insertPoint = '  }, [publicKey, signMessage, setIsLoading, setUser]); // Dependências corretas\n\n';
const replacement = insertPoint + connectWalletFunction[0];

content = content.replace(insertPoint, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Função connectWalletToUser movida para antes do useEffect');
