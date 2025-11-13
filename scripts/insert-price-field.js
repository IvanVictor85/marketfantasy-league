const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'src/app/[locale]/dashboard/page.tsx');
const lines = fs.readFileSync(dashboardPath, 'utf8').split('\n');

// Procurar pela linha com currentPrice e adicionar price logo depois
let modified = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('currentPrice: player.currentPrice || 0')) {
    // Verificar se a próxima linha é points (ou seja, se price está faltando)
    if (lines[i + 1].includes('points:')) {
      // Inserir price antes de points
      const indentation = lines[i].match(/^(\s+)/)[1];
      lines.splice(i + 1, 0, `${indentation}price: player.currentPrice || 0, // Obrigatório no tipo Player`);
      modified = true;
      console.log(`✅ Linha ${i + 2}: Campo 'price' inserido com sucesso!`);
      break;
    }
  }
}

if (modified) {
  fs.writeFileSync(dashboardPath, lines.join('\n'), 'utf8');
  console.log('✅ Arquivo salvo!');
} else {
  console.log('⚠️ Não foi necessário inserir o campo price (já existe ou não foi encontrado)');
}
