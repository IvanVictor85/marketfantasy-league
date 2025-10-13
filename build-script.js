const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Função para remover pasta .next com retry
async function removeNextFolder() {
  const nextPath = path.join(__dirname, '.next');
  
  for (let i = 0; i < 3; i++) {
    try {
      if (fs.existsSync(nextPath)) {
        fs.rmSync(nextPath, { recursive: true, force: true });
        console.log('✅ Pasta .next removida com sucesso');
      }
      break;
    } catch (error) {
      console.log(`⚠️ Tentativa ${i + 1} de remover .next falhou:`, error.message);
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

// Função principal de build
async function buildProject() {
  try {
    console.log('🚀 Iniciando build personalizado...');
    
    // Remover pasta .next
    await removeNextFolder();
    
    // Executar build
    console.log('📦 Executando next build...');
    
    const buildProcess = spawn('npx', ['next', 'build'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build concluído com sucesso!');
        process.exit(0);
      } else {
        console.log(`❌ Build falhou com código ${code}`);
        process.exit(code);
      }
    });
    
    buildProcess.on('error', (error) => {
      console.error('❌ Erro no processo de build:', error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Erro no script de build:', error);
    process.exit(1);
  }
}

buildProject();